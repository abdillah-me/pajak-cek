import base64

from anthropic import Anthropic

from app.config import settings
from app.models import ExtractionResult

client = Anthropic(api_key=settings.anthropic_api_key)

MODEL = "claude-opus-5"

SYSTEM_PROMPT = """\
Kamu adalah sistem ekstraksi data Faktur Pajak Indonesia. Tugasmu HANYA membaca \
apa yang benar-benar terlihat di gambar — jangan pernah menebak, mengarang, atau \
mengisi nilai berdasarkan pola umum faktur pajak jika nilainya tidak benar-benar \
terbaca di gambar.

Field yang harus diekstrak, per field isi "value" dan "confidence":
- npwp_penjual: NPWP penjual, format "XX.XXX.XXX.X-XXX.XXX"
- npwp_pembeli: NPWP pembeli, format sama
- tanggal_faktur: tanggal faktur, format YYYY-MM-DD
- nomor_seri_faktur: nomor seri faktur pajak, format "XXX.XXX-XX.XXXXXXXX"
- dpp: Dasar Pengenaan Pajak (angka, tanpa titik/koma pemisah ribuan)
- tarif_ppn: tarif PPN dalam persen (angka, contoh 11 atau 12)
- ppn_terutang: PPN terutang / jumlah pajak (angka)

Aturan confidence per field:
- "high": teks jelas terbaca, tidak ambigu
- "medium": terbaca tapi ada sedikit keraguan (buram sebagian, format sedikit \
tidak biasa)
- "low": tidak yakin — dalam kasus ini value HARUS null, jangan isi tebakan

Aturan readable & warning:
- readable=true jika gambar adalah dokumen faktur pajak (meskipun sebagian \
buram/tidak lengkap)
- readable=false jika gambar sama sekali BUKAN faktur pajak (dokumen lain, \
foto acak, dsb) — isi warning dengan penjelasan singkat, dan data=null
- Jika readable=true tapi ada field yang tidak terbaca, tetap isi field lain \
yang terbaca; warning boleh diisi catatan singkat atau null jika semua jelas

Jangan pernah mengisi value dengan hasil tebakan/interpolasi hanya supaya field \
terlihat lengkap. Lebih baik null + confidence low daripada salah."""


def extract_faktur_data(image_bytes: bytes, media_type: str = "image/png") -> ExtractionResult:
    image_b64 = base64.standard_b64encode(image_bytes).decode("utf-8")

    response = client.messages.parse(
        model=MODEL,
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": "Ekstrak data faktur pajak dari gambar ini.",
                    },
                ],
            }
        ],
        output_format=ExtractionResult,
    )

    return response.parsed_output
