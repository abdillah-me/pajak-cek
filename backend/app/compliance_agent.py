from anthropic import Anthropic
from app.config import settings
from app.models import ExtractedFakturData, ComplianceReport
from app.rag import query_regulations

client = Anthropic(api_key=settings.anthropic_api_key)


def check_compliance(data: ExtractedFakturData) -> ComplianceReport:
    """
    TODO(kamu): implementasikan ini.

    Yang perlu kamu putuskan & tulis:
    1. Query apa yang dikirim ke query_regulations() berdasarkan data hasil ekstraksi?
       (satu query gabungan, atau beberapa query terpisah per aspek yang dicek -
       tarif, format NSFP, konsistensi hitungan?)
    2. Prompt untuk LLM yang membandingkan data faktur dengan hasil retrieval -
       harus eksplisit menyuruh model HANYA menyimpulkan dari dokumen yang di-retrieve,
       bukan dari pengetahuan umum. Bagaimana kamu memastikan ini di level prompt?
    3. Kapan status jadi "inconclusive" (bukan compliant/flagged)? Pikirkan: apa yang
       terjadi kalau query_regulations() tidak mengembalikan dokumen yang relevan sama
       sekali (skor similarity rendah)?
    4. Bagaimana memetakan hasil reasoning LLM ke ComplianceIssue (field, message,
       regulation_source) yang terstruktur? Sama seperti Task 6, pikirkan trade-off
       antara "minta JSON di prompt" vs "tool use/structured output".
    5. Validasi non-AI yang bisa kamu lakukan di kode Python biasa (bukan lewat LLM)
       sebelum/sesudah reasoning LLM - misal, cek format NSFP 17 digit itu regex
       sederhana, tidak perlu LLM. Pikirkan mana yang sebaiknya deterministik vs
       yang butuh reasoning LLM (soal ini sengaja tidak dijawabkan biar kamu yang
       menentukan sendiri argumennya).
    """
    raise NotImplementedError
