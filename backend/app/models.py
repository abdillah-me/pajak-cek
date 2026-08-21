from typing import Generic, Literal, TypeVar
from pydantic import BaseModel

T = TypeVar("T")
Confidence = Literal["high", "medium", "low"]


class ExtractedField(BaseModel, Generic[T]):
    value: T | None
    confidence: Confidence


class ExtractedFakturData(BaseModel):
    npwp_penjual: ExtractedField[str]
    npwp_pembeli: ExtractedField[str]
    tanggal_faktur: ExtractedField[str]  # format YYYY-MM-DD
    nomor_seri_faktur: ExtractedField[str]
    dpp: ExtractedField[float]
    tarif_ppn: ExtractedField[float]  # dalam persen, mis. 11 atau 12
    ppn_terutang: ExtractedField[float]


class ExtractionResult(BaseModel):
    readable: bool
    warning: str | None
    data: ExtractedFakturData | None


class ComplianceIssue(BaseModel):
    field: str
    message: str
    regulation_source: str


class ComplianceReport(BaseModel):
    status: Literal["compliant", "flagged", "inconclusive"]
    issues: list[ComplianceIssue]
    sources_used: list[str]
