import os
import io
from pathlib import Path
from PIL import Image, ImageDraw
import barcode
from barcode.writer import ImageWriter
import qrcode
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from stage1_ml_ocr.app.core.config import settings

def generate_qr_image(data_text: str, size: int = 120) -> Image.Image:
    """Generates a PIL Image of a 2D QR code."""
    qr = qrcode.QRCode(box_size=4, border=1)
    qr.add_data(data_text)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    return img.convert("RGB").resize((size, size))

def generate_1d_barcode_image(code_text: str, code_type: str = "code128") -> Image.Image:
    """Generates a PIL Image of a 1D Barcode."""
    try:
        bc_class = barcode.get_barcode_class(code_type)
        bc = bc_class(code_text, writer=ImageWriter())
        buf = io.BytesIO()
        bc.write(buf, options={"write_text": True, "module_height": 8.0, "font_size": 7})
        buf.seek(0)
        return Image.open(buf).convert("RGB")
    except Exception:
        # Fallback synthetic barcode pattern
        img = Image.new("RGB", (240, 60), color="#ffffff")
        draw = ImageDraw.Draw(img)
        for x in range(10, 230, 4):
            draw.line([(x, 10), (x, 45)], fill="#000000", width=2)
        draw.text((30, 48), code_text, fill="#000000")
        return img

def create_sample_pdf(
    file_path: Path,
    title: str,
    doc_num: str,
    lines: list,
    header_barcode: str = None,
    header_qr: str = None,
    footer_barcode: str = None,
    footer_qr: str = None,
    item_barcodes: list = None
):
    os.makedirs(file_path.parent, exist_ok=True)
    c = canvas.Canvas(str(file_path), pagesize=letter)
    width, height = letter
    
    # 1. Header Banner
    c.setFillColor(colors.HexColor("#1e293b"))
    c.rect(0, height - 90, width, 90, fill=True, stroke=False)
    
    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 18)
    c.drawString(35, height - 40, title)
    c.setFont("Helvetica", 10)
    c.drawString(35, height - 60, f"Document Reference: {doc_num} | System Verified")

    # Header Barcode & QR Code
    temp_dir = file_path.parent / ".temp_assets"
    os.makedirs(temp_dir, exist_ok=True)

    if header_qr:
        qr_img = generate_qr_image(header_qr, 70)
        qr_path = temp_dir / f"h_qr_{doc_num}.png"
        qr_img.save(str(qr_path))
        c.drawImage(str(qr_path), width - 90, height - 80, width=65, height=65)

    if header_barcode:
        bc_img = generate_1d_barcode_image(header_barcode)
        bc_path = temp_dir / f"h_bc_{doc_num}.png"
        bc_img.save(str(bc_path))
        c.drawImage(str(bc_path), width - 260, height - 75, width=160, height=45)

    # 2. Body Text & Requisites
    c.setFillColor(colors.HexColor("#334155"))
    c.setFont("Helvetica", 10)
    y = height - 120
    for idx, line in enumerate(lines):
        if line.startswith("---"):
            c.setStrokeColor(colors.HexColor("#cbd5e1"))
            c.line(35, y, width - 35, y)
            y -= 18
        elif line.startswith("TOTAL") or line.startswith("Grand Total"):
            c.setFont("Helvetica-Bold", 12)
            c.setFillColor(colors.HexColor("#0f172a"))
            c.drawString(35, y, line)
            c.setFont("Helvetica", 10)
            c.setFillColor(colors.HexColor("#334155"))
            y -= 22
        else:
            c.drawString(35, y, line)
            y -= 18

    # 3. Item Lines Barcodes (middle region)
    if item_barcodes:
        y_item = height - 240
        for ibc in item_barcodes:
            ibc_img = generate_1d_barcode_image(ibc)
            ibc_path = temp_dir / f"item_bc_{ibc}.png"
            ibc_img.save(str(ibc_path))
            c.drawImage(str(ibc_path), 380, y_item, width=150, height=35)
            y_item -= 40

    # 4. Footer Barcode & QR Code (bottom 15% region)
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.line(35, 110, width - 35, 110)

    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(colors.HexColor("#64748b"))
    c.drawString(35, 95, "AUTHENTICATION & AUDIT TRAIL VERIFICATION")

    if footer_qr:
        f_qr_img = generate_qr_image(footer_qr, 70)
        f_qr_path = temp_dir / f"f_qr_{doc_num}.png"
        f_qr_img.save(str(f_qr_path))
        c.drawImage(str(f_qr_path), width - 90, 25, width=70, height=70)

    if footer_barcode:
        f_bc_img = generate_1d_barcode_image(footer_barcode)
        f_bc_path = temp_dir / f"f_bc_{doc_num}.png"
        f_bc_img.save(str(f_bc_path))
        c.drawImage(str(f_bc_path), 35, 30, width=220, height=50)

    c.save()

def create_sample_image(
    file_path: Path,
    title: str,
    text_lines: list,
    header_barcode: str = None,
    header_qr: str = None,
    footer_barcode: str = None,
    footer_qr: str = None,
    item_barcode: str = None
):
    os.makedirs(file_path.parent, exist_ok=True)
    width, height = 850, 700
    img = Image.new("RGB", (width, height), color="#ffffff")
    draw = ImageDraw.Draw(img)
    
    # 1. Header Bar
    draw.rectangle([(0, 0), (width, 85)], fill="#0f172a")
    draw.text((25, 20), title, fill="#38bdf8")
    
    if header_qr:
        qr = generate_qr_image(header_qr, 70)
        img.paste(qr, (width - 85, 8))
        
    if header_barcode:
        bc = generate_1d_barcode_image(header_barcode)
        img.paste(bc.resize((170, 45)), (width - 270, 15))

    # 2. Text lines
    y = 110
    for line in text_lines:
        draw.text((30, y), line, fill="#1e293b")
        y += 26

    # 3. Item Barcode
    if item_barcode:
        ibc = generate_1d_barcode_image(item_barcode)
        img.paste(ibc.resize((180, 45)), (420, 240))

    # 4. Footer Barcode & QR Code
    draw.line([(30, height - 120), (width - 30, height - 120)], fill="#cbd5e1", width=1)
    draw.text((30, height - 110), "DIGITAL AUDIT & REMITTANCE FOOTER", fill="#64748b")
    
    if footer_qr:
        f_qr = generate_qr_image(footer_qr, 75)
        img.paste(f_qr, (width - 95, height - 95))
        
    if footer_barcode:
        f_bc = generate_1d_barcode_image(footer_barcode)
        img.paste(f_bc.resize((240, 50)), (30, height - 85))

    img.save(str(file_path), "PNG")

def generate_initial_dataset():
    """Populates dataset_for_ml with sample base docs and user specific email folders."""
    dataset_dir = settings.DATASET_DIR
    os.makedirs(dataset_dir, exist_ok=True)
    
    # 1. Base Commercial Invoice (PDF)
    create_sample_pdf(
        dataset_dir / "base_invoice_01.pdf",
        "GLOBAL TECH SOLUTIONS - INVOICE",
        "INV-2026-8819",
        [
            "From: Global Tech Solutions Inc. | 500 Silicon Ave, CA",
            "Bill To: Quantum Innovations Ltd | 77 Tech Park, NY",
            "Date: 2026-08-20 | Due Date: 2026-09-20",
            "--------------------------------------------------",
            "1x Cloud Server Infrastructure Setup - $2,500.00",
            "1x Machine Learning Optimization Audit - $1,800.00",
            "--------------------------------------------------",
            "Subtotal: $4,300.00",
            "Tax (10%): $430.00",
            "TOTAL AMOUNT DUE: $4,730.00 USD"
        ],
        header_barcode="INV-2026-8819",
        header_qr="HTTPS://PORTAL.GLOBALTECH.IO/INV/8819",
        footer_barcode="BANK-ROUTING-9901-4412",
        footer_qr="HTTPS://AUDIT.GLOBALTECH.IO/VERIFY/8819",
        item_barcodes=["SKU-SRV-CLOUD-99", "SKU-ML-AUDIT-01"]
    )
    
    # 2. Base Medical & Pharmaceutical Invoice (PDF)
    create_sample_pdf(
        dataset_dir / "base_medical_invoice_01.pdf",
        "NEXUS BIOPHARMA PHARMACEUTICAL INVOICE",
        "LV-ZVA-PHARM-2026-089",
        [
            "Supplier: Nexus BioPharma International S.A. | Zurich",
            "Consignee: St. Jude Metropolitan Medical Center | Oncology Dept",
            "Registry Code: LV-ZVA-PHARM-2026-089 | FDA NDC: 50458-578-01",
            "Cold-Chain Logistics: Verified Active (+2°C to +8°C)",
            "Batch / Lot: LOT-8924 | Date: 2026-08-15",
            "--------------------------------------------------",
            "100x Recombinant Biologic Vials (10ml) - $12,000.00",
            "1x Cold-Chain Cryogenic Handling - $1,500.00",
            "--------------------------------------------------",
            "Subtotal: $13,500.00",
            "Tax / VAT (7.5%): $1,012.50",
            "TOTAL AMOUNT: $14,512.50 USD"
        ],
        header_barcode="LV-ZVA-PHARM-2026",
        header_qr="HTTPS://NEXUS-MED.IO/AUDIT/LV-ZVA-99120",
        footer_barcode="COLD-CHAIN-RFID-LOGISTICS",
        footer_qr="HTTPS://AUDIT.NEXUS-BIOPHARMA.ORG/SIG/LOT-8924",
        item_barcodes=["50458-578-01", "RFID-COLD-2C-8C"]
    )
    
    # 3. Base Retail Receipt (PNG Image)
    create_sample_image(
        dataset_dir / "base_receipt_01.png",
        "TARGET RETAIL STORE RECEIPT #9042",
        [
            "Store #0482 - Cashier: Maria",
            "Date: 2026-08-22 14:32",
            "1x Wireless Laser Mouse: $45.00",
            "2x USB-C High Speed Cable: $30.00",
            "Subtotal: $75.00",
            "Sales Tax (8.25%): $6.19",
            "TOTAL PAID VISA: $81.19 USD",
            "Thank you for shopping at Target!"
        ],
        header_barcode="STORE-0482-9042",
        header_qr="HTTPS://RECEIPT.TARGET.COM/R/9042",
        footer_barcode="POS-AUTH-991203",
        footer_qr="HTTPS://TARGET.COM/FEEDBACK/9042",
        item_barcode="SKU-8819204"
    )

    # 4. Multi-tenant user dataset: +alice@biocorp.com (PDF)
    user1_dir = dataset_dir / "+alice@biocorp.com"
    create_sample_pdf(
        user1_dir / "alice_clinical_trial_inv.pdf",
        "ALICE BIOCORP - CLINICAL TRIAL INVOICE",
        "BIO-2026-7711",
        [
            "From: Alice BioCorp Research Lab | Boston MA",
            "To: Harvard Medical Research Center",
            "Date: 2026-08-10 | Payment Terms: Net 15",
            "FDA Trial Reference: IND-99120",
            "--------------------------------------------------",
            "1x Genomic Sequencing Panel (96 Samples) - $8,400.00",
            "1x Bio-informatics Statistical Report - $2,200.00",
            "--------------------------------------------------",
            "Subtotal: $10,600.00",
            "Tax: $0.00 (Research Tax Exempt)",
            "TOTAL USD: $10,600.00"
        ],
        header_barcode="BIO-IND-99120",
        header_qr="HTTPS://BIORESEARCH.ALICE.ORG/TRIAL/7711",
        footer_barcode="RESEARCH-GRANT-EXEMPT-01",
        footer_qr="HTTPS://FDA.GOV/IND/99120/AUDIT"
    )

    # 5. Multi-tenant user dataset: +bob@enterprise.com (PNG Image)
    user2_dir = dataset_dir / "+bob@enterprise.com"
    create_sample_image(
        user2_dir / "bob_pos_hardware_receipt.png",
        "BOB ENTERPRISE LOGISTICS RECEIPT",
        [
            "Order Ref: BOB-LOG-4412",
            "Date: 2026-08-18",
            "Item: Industrial Barcode Scanners (x4) - $1,200.00",
            "Item: Thermal Label Printer (x2) - $600.00",
            "Subtotal: $1,800.00",
            "State Tax: $144.00",
            "TOTAL: $1,944.00 USD"
        ],
        header_barcode="BOB-LOG-4412",
        header_qr="HTTPS://BOB-LOGISTICS.COM/ORD/4412",
        footer_barcode="WAREHOUSE-BAY-4-DISPATCH",
        footer_qr="HTTPS://BOB-LOGISTICS.COM/TRACK/4412"
    )

if __name__ == "__main__":
    generate_initial_dataset()
