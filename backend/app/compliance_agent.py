import re

from anthropic import Anthropic
from pydantic import BaseModel

from app.config import settings
from app.models import ComplianceIssue, ComplianceReport, ExtractedFakturData
from app.rag import query_regulations

client = Anthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-opus-5"

NSFP_PATTERN = re.compile(r"^\d{3}\.\d{3}-\d{2}\.\d{8}$")
CALCULATION_TOLERANCE_RUPIAH = 1


class _TarifCheckResult(BaseModel):
    valid: bool
    reasoning: str
    confident: bool


def _check_nsfp_format(data: ExtractedFakturData) -> ComplianceIssue | None:
    nsfp = data.nomor_seri_faktur.value
    if nsfp is None or NSFP_PATTERN.match(nsfp):
        return None
    return ComplianceIssue(
        field="nomor_seri_faktur",
        message=(
            f"Format nomor seri faktur '{nsfp}' tidak sesuai ketentuan "
            "(harus 3 digit.3 digit-2 digit.8 digit, contoh 010.001-25.00000001)"
        ),
        regulation_source="PMK 131/2024 - Petunjuk Teknis Pembuatan Faktur Pajak",
    )


def _check_ppn_calculation(data: ExtractedFakturData) -> ComplianceIssue | None:
    dpp, tarif, ppn = data.dpp.value, data.tarif_ppn.value, data.ppn_terutang.value
    if dpp is None or tarif is None or ppn is None:
        return None
    expected = dpp * tarif / 100
    if abs(expected - ppn) <= CALCULATION_TOLERANCE_RUPIAH:
        return None
    return ComplianceIssue(
        field="ppn_terutang",
        message=(
            f"PPN terutang ({ppn:,.0f}) tidak konsisten dengan DPP x tarif "
            f"({dpp:,.0f} x {tarif:g}% = {expected:,.0f})"
        ),
        regulation_source="Perhitungan matematis (DPP x tarif PPN)",
    )


def _check_tarif_validity(
    data: ExtractedFakturData,
) -> tuple[ComplianceIssue | None, list[str], bool]:
    """Returns (issue_or_none, sources_used, confident)."""
    tarif = data.tarif_ppn.value
    tanggal = data.tanggal_faktur.value
    if tarif is None:
        return None, [], True

    docs = query_regulations(f"tarif PPN berlaku untuk tanggal {tanggal or ''} berapa persen")
    if not docs:
        return None, [], False

    sources = [d["source"] for d in docs]
    context = "\n\n".join(f"[{d['source']}] {d['text']}" for d in docs)

    response = client.messages.parse(
        model=MODEL,
        max_tokens=1024,
        system=(
            "Kamu adalah asisten kepatuhan pajak. Jawab HANYA berdasarkan potongan "
            "regulasi yang diberikan di prompt. Jika potongan regulasi yang diberikan "
            "tidak cukup untuk menjawab dengan pasti apakah tarif ini valid untuk "
            "tanggal tersebut, set confident=false dan JANGAN menjawab dari pengetahuan "
            "umum di luar teks yang diberikan — lebih baik mengaku tidak yakin daripada "
            "menebak."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"Potongan regulasi:\n{context}\n\n"
                    f"Faktur pajak ini bertanggal {tanggal} dengan tarif PPN {tarif}%. "
                    "Apakah tarif ini valid untuk tanggal tersebut menurut regulasi di atas?"
                ),
            }
        ],
        output_format=_TarifCheckResult,
    )
    result = response.parsed_output

    if not result.confident:
        return None, sources, False
    if result.valid:
        return None, sources, True
    return (
        ComplianceIssue(field="tarif_ppn", message=result.reasoning, regulation_source=sources[0]),
        sources,
        True,
    )


def check_compliance(data: ExtractedFakturData) -> ComplianceReport:
    issues: list[ComplianceIssue] = []
    sources_used: list[str] = []

    for issue in (_check_nsfp_format(data), _check_ppn_calculation(data)):
        if issue:
            issues.append(issue)

    tarif_issue, tarif_sources, tarif_confident = _check_tarif_validity(data)
    for source in tarif_sources:
        if source not in sources_used:
            sources_used.append(source)
    if tarif_issue:
        issues.append(tarif_issue)

    if issues:
        status = "flagged"
    elif not tarif_confident:
        status = "inconclusive"
    else:
        status = "compliant"

    return ComplianceReport(status=status, issues=issues, sources_used=sources_used)
