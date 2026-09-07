import re
import logging
from typing import List, Tuple, Dict, Any, Optional
from PIL import Image
import zxingcpp
from stage1_ml_ocr.app.schemas.ocr import BarcodeInfo

logger = logging.getLogger("stage1.barcode_engine")

class BarcodeEngine:
    """
    Intelligent Barcode and QR Code recognition engine.
    Detects 1D barcodes and 2D QR codes and categorizes them by spatial zone:
    - HEADER: Top zone (e.g. Invoice tracking, hospital registry, patient ID)
    - FOOTER: Bottom zone (e.g. Remittance slip, digital signature, audit verification)
    - ITEM_LINE: Product / line-item zone (e.g. NDC pharmaceuticals, hardware SKUs)
    """

    def scan_image(self, image: Image.Image) -> List[BarcodeInfo]:
        """Scans PIL Image for all barcodes and QR codes with spatial localization."""
        detected: List[BarcodeInfo] = []
        try:
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            width, height = image.size
            if width == 0 or height == 0:
                return detected

            # 1. Computer Vision Recognition via ZXing-CPP
            zxing_results = zxingcpp.read_barcodes(image)
            for r in zxing_results:
                pos = r.position
                # Calculate bounding box center Y and normalized vertical position
                # pos has points topLeft, topRight, bottomRight, bottomLeft
                y_coords = [pos.top_left.y, pos.top_right.y, pos.bottom_right.y, pos.bottom_left.y]
                x_coords = [pos.top_left.x, pos.top_right.x, pos.bottom_right.x, pos.bottom_left.x]
                min_y, max_y = min(y_coords), max(y_coords)
                min_x, max_x = min(x_coords), max(x_coords)
                center_y = (min_y + max_y) / 2.0
                norm_y = center_y / float(height)

                # Determine spatial location
                if norm_y < 0.28:
                    location = "HEADER"
                elif norm_y > 0.72:
                    location = "FOOTER"
                else:
                    location = "ITEM_LINE"

                format_str = str(r.format).replace("BarcodeFormat.", "").replace(" ", "_").upper()
                is_qr = "QR" in format_str or "MATRIX" in format_str or "AZTEC" in format_str

                detected.append(BarcodeInfo(
                    code_type="QR_CODE" if is_qr else format_str,
                    payload=r.text,
                    location=location,
                    x=round(float(min_x), 1),
                    y=round(float(min_y), 1),
                    width=round(float(max_x - min_x), 1),
                    height=round(float(max_y - min_y), 1),
                    confidence=1.0,
                    parsed_metadata={
                        "symbology": format_str,
                        "normalized_y": round(norm_y, 3),
                        "ec_level": getattr(r, "ec_level", "STANDARD"),
                        "is_2d_code": is_qr
                    }
                ))
        except Exception as e:
            logger.warning(f"Barcode scanning exception: {e}")

        return detected

    def scan_text_heuristics(self, text: str) -> List[BarcodeInfo]:
        """Extracts embedded barcode and QR tags from text layers if visual scan is absent."""
        heuristic_codes: List[BarcodeInfo] = []
        lines = text.splitlines()
        total_lines = len(lines) if lines else 1

        for idx, line in enumerate(lines):
            norm_y = idx / float(total_lines)
            if norm_y < 0.28:
                loc = "HEADER"
            elif norm_y > 0.72:
                loc = "FOOTER"
            else:
                loc = "ITEM_LINE"

            # Check for NDC codes
            ndc_match = re.search(r"\b(?:NDC|FDA\s*NDC)[:\s]*([0-9]{4,5}-[0-9]{3,4}-[0-9]{1,2})\b", line, re.IGNORECASE)
            if ndc_match:
                heuristic_codes.append(BarcodeInfo(
                    code_type="GS1_128_NDC",
                    payload=f"(01)003{ndc_match.group(1).replace('-', '')}",
                    location="ITEM_LINE" if (0.25 <= norm_y <= 0.75) else loc,
                    x=40.0,
                    y=round(idx * 20.0, 1),
                    width=250.0,
                    height=40.0,
                    confidence=0.95,
                    parsed_metadata={"entity": "PHARMACEUTICAL_NDC", "ndc": ndc_match.group(1)}
                ))

            # Check for ZVA Registry Code
            zva_match = re.search(r"\b(LV-ZVA-[A-Za-z0-9\-]+)\b", line)
            if zva_match:
                heuristic_codes.append(BarcodeInfo(
                    code_type="CODE_128",
                    payload=zva_match.group(1),
                    location="HEADER" if norm_y < 0.35 else loc,
                    x=50.0,
                    y=round(idx * 20.0, 1),
                    width=280.0,
                    height=45.0,
                    confidence=0.98,
                    parsed_metadata={"entity": "ZVA_REGISTRY_CODE", "code": zva_match.group(1)}
                ))

            # Check for Digital Audit Tokens / QR URLs
            url_qr = re.search(r"(https?://[^\s]+|AUDIT-TOKEN-[A-Za-z0-9\-]+)", line, re.IGNORECASE)
            if url_qr and (norm_y > 0.65 or norm_y < 0.35):
                heuristic_codes.append(BarcodeInfo(
                    code_type="QR_CODE",
                    payload=url_qr.group(1),
                    location="FOOTER" if norm_y > 0.5 else "HEADER",
                    x=450.0,
                    y=round(idx * 20.0, 1),
                    width=100.0,
                    height=100.0,
                    confidence=0.95,
                    parsed_metadata={"entity": "DIGITAL_AUDIT_TOKEN", "payload": url_qr.group(1)}
                ))

        return heuristic_codes

    def group_barcodes(self, barcodes: List[BarcodeInfo]) -> Dict[str, List[BarcodeInfo]]:
        """Groups detected codes into header, footer, item_line, and QR categories."""
        header_barcodes = []
        footer_barcodes = []
        header_qr_codes = []
        footer_qr_codes = []
        item_barcodes = []

        for b in barcodes:
            is_qr = "QR" in b.code_type.upper() or "MATRIX" in b.code_type.upper()
            if b.location == "HEADER":
                if is_qr:
                    header_qr_codes.append(b)
                else:
                    header_barcodes.append(b)
            elif b.location == "FOOTER":
                if is_qr:
                    footer_qr_codes.append(b)
                else:
                    footer_barcodes.append(b)
            else:
                item_barcodes.append(b)

        return {
            "header_barcodes": header_barcodes,
            "footer_barcodes": footer_barcodes,
            "header_qr_codes": header_qr_codes,
            "footer_qr_codes": footer_qr_codes,
            "item_barcodes": item_barcodes,
            "all_barcodes": barcodes
        }

barcode_engine = BarcodeEngine()
