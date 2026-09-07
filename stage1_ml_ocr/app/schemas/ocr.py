from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    text: str
    x: float
    y: float
    width: float
    height: float
    confidence: float

class BarcodeInfo(BaseModel):
    code_type: str  # e.g., "QR_CODE", "CODE_128", "EAN_13", "DATA_MATRIX"
    payload: str
    location: str   # "HEADER", "FOOTER", "ITEM_LINE", "BODY"
    x: float = 0.0
    y: float = 0.0
    width: float = 0.0
    height: float = 0.0
    confidence: float = 1.0
    parsed_metadata: Dict[str, Any] = Field(default_factory=dict)

class LineItem(BaseModel):
    description: str
    quantity: Optional[float] = 1.0
    unit_price: Optional[float] = None
    total_price: Optional[float] = None
    item_code: Optional[str] = None
    barcode: Optional[str] = None
    barcode_type: Optional[str] = None
    qr_code: Optional[str] = None
    barcode_location: Optional[str] = None

class ExtractedEntities(BaseModel):
    document_type: str = "UNKNOWN"
    document_type_confidence: float = 0.0
    invoice_or_doc_number: Optional[str] = None
    date: Optional[str] = None
    due_date: Optional[str] = None
    sender_name: Optional[str] = None
    sender_address: Optional[str] = None
    recipient_name: Optional[str] = None
    recipient_address: Optional[str] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    tax_rate_percent: Optional[float] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = "USD"
    items: List[LineItem] = Field(default_factory=list)
    # Header and Footer Barcodes & QR codes
    header_barcodes: List[BarcodeInfo] = Field(default_factory=list)
    footer_barcodes: List[BarcodeInfo] = Field(default_factory=list)
    header_qr_codes: List[BarcodeInfo] = Field(default_factory=list)
    footer_qr_codes: List[BarcodeInfo] = Field(default_factory=list)
    all_barcodes: List[BarcodeInfo] = Field(default_factory=list)
    custom_fields: Dict[str, Any] = Field(default_factory=dict)
    key_value_pairs: Dict[str, str] = Field(default_factory=dict)

class RecognitionResponse(BaseModel):
    success: bool = True
    filename: str
    content_type: str
    file_size_bytes: int
    user_email: Optional[str] = None
    page_count: int = 1
    raw_text: str
    entities: ExtractedEntities
    bounding_boxes: List[BoundingBox] = Field(default_factory=list)
    model_version: str = "2.1.0"
    processing_time_ms: float
    timestamp: str
