from anthropic import Anthropic
from app.config import settings
from app.models import ExtractionResult

client = Anthropic(api_key=settings.anthropic_api_key)


def extract_faktur_data(image_bytes: bytes, media_type: str = "image/png") -> ExtractionResult:
    """
    TODO(kamu): implementasikan ini.

    Yang perlu kamu putuskan & tulis:
    1. System prompt yang eksplisit menyuruh model:
       - HANYA membaca apa yang benar-benar terlihat di gambar (jangan menebak/mengarang)
       - Untuk tiap field, kalau tidak yakin/buram, isi value=null dan confidence="low"
       - Output HARUS berupa JSON yang sesuai schema ExtractedFakturData (pertimbangkan:
         mau pakai Claude tool use / structured output, atau minta JSON di prompt lalu
         parse manual? Ada trade-off reliability vs kompleksitas kode)
    2. Bagaimana menangani kalau gambar sama sekali bukan faktur pajak (bukan cuma buram,
       tapi salah dokumen) -> readable=False, warning yang jelas
    3. Bagaimana memvalidasi output model sebelum dikembalikan (misal: kalau model
       mengembalikan JSON yang tidak valid/tidak lengkap, apa yang terjadi? Retry? Error?)
    """
    raise NotImplementedError
