from app.extraction_agent import extract_faktur_data
from app.compliance_agent import check_compliance
from app.models import ExtractionResult, ComplianceReport


def analyze_faktur(image_bytes: bytes, media_type: str) -> tuple[ExtractionResult, ComplianceReport | None]:
    extraction = extract_faktur_data(image_bytes, media_type)
    if not extraction.readable or extraction.data is None:
        return extraction, None
    compliance = check_compliance(extraction.data)
    return extraction, compliance
