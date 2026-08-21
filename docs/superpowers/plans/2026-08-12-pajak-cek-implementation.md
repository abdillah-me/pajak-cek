# Pajak-Cek Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Pembagian kerja (disepakati dengan pemilik proyek):** Setiap task ditandai **[CLAUDE]** (boilerplate/setup — dikerjakan penuh oleh AI) atau **[USER]** (logic inti AI/frontend — dikerjakan oleh pemilik proyek, AI berperan sebagai pendamping/reviewer, bukan menulis solusi lengkap). Task **[USER]** sengaja TIDAK berisi kode lengkap — hanya kontrak/signature, konteks, dan pertimbangan trade-off — karena bagian ini yang harus bisa dipertanggungjawabkan pemilik proyek saat sidang skripsi/penilaian bootcamp.

**Goal:** Membangun Pajak-Cek — web app yang mengekstrak data dari faktur pajak (LLM vision) dan mengecek kesesuaiannya terhadap regulasi PPN terkini (RAG), sesuai spec di `docs/superpowers/specs/2026-08-12-pajak-cek-design.md`.

**Architecture:** FastAPI backend dengan 2 agent terpisah (Extraction Agent, Compliance Agent) yang dihubungkan lewat orchestration Python linear (bukan framework agent). RAG memakai ChromaDB lokal berisi 5 dokumen regulasi PPN. Frontend Next.js terpisah, mengonsumsi backend lewat REST API.

**Tech Stack:** Python 3.11+, FastAPI, Anthropic SDK (Claude, vision), ChromaDB, Next.js 14+ (App Router), Tailwind CSS, shadcn/ui, Vercel (frontend deploy), Railway/Render (backend deploy).

## Global Constraints

- Semua dokumentasi proses (README, catatan keputusan) ditulis dalam format Markdown (`.md`), sesuai preferensi pemilik proyek.
- Kredensial (Anthropic API key, dsb) **tidak boleh** hardcoded di kode — selalu lewat environment variable / `.env` (yang di-gitignore).
- Scope dokumen: hanya **Faktur Pajak**, hanya field-field yang didefinisikan di `ExtractedFakturData` (Task 5). Jenis dokumen lain di luar scope.
- Prinsip error handling: **fail loud, jangan mengarang** — field yang tidak terbaca jelas harus `null`/`confidence: low`, bukan ditebak; RAG yang tidak menemukan dokumen relevan harus bilang eksplisit, bukan menjawab dari pengetahuan umum model.
- Repo ini belum berupa git repository — Task 1 mencakup `git init`.

---

## Phase 0 — Setup Proyek

### Task 1: Struktur Repo & Backend Scaffold [CLAUDE]

**Files:**
- Create: `.gitignore`
- Create: `backend/pyproject.toml` (atau `requirements.txt`)
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/.env.example`
- Create: `backend/tests/test_health.py`

**Interfaces:**
- Produces: `GET /health` endpoint (`{"status": "ok"}`) — dipakai Task 11 sebagai baseline sebelum menambah endpoint lain.
- Produces: `app.config.Settings` (Pydantic `BaseSettings`) dengan field `anthropic_api_key: str`, dibaca dari env var `ANTHROPIC_API_KEY`.

- [ ] **Step 1: Init git repo & struktur folder**

```bash
cd "/Users/abdillah/Documents/Course/AI ENGINEER by Ruang Guru/Final projects"
git init
mkdir -p backend/app backend/tests frontend
```

- [ ] **Step 2: Buat `.gitignore`**

```
# Python
__pycache__/
*.pyc
.venv/
.env

# Node
node_modules/
.next/
.env.local

# Data
backend/data/chroma_db/
```

- [ ] **Step 3: Buat `backend/pyproject.toml`**

```toml
[project]
name = "pajak-cek-backend"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.110",
    "uvicorn[standard]>=0.29",
    "anthropic>=0.34",
    "chromadb>=0.5",
    "pydantic-settings>=2.2",
    "python-multipart>=0.0.9",
    "pypdf>=4.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "httpx>=0.27"]
```

- [ ] **Step 4: Buat `backend/app/config.py`**

```python
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str
    chroma_persist_dir: str = "data/chroma_db"


settings = Settings()
```

- [ ] **Step 5: Buat `backend/.env.example`**

```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

- [ ] **Step 6: Buat `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Pajak-Cek API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dipersempit ke domain Vercel saat deploy (Task 14)
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **Step 7: Tulis test & jalankan**

```python
# backend/tests/test_health.py
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

Run: `cd backend && pip install -e ".[dev]" && pytest tests/test_health.py -v`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add .gitignore backend/
git commit -m "chore: scaffold FastAPI backend"
```

---

### Task 2: Frontend Scaffold [CLAUDE]

**Files:**
- Create: `frontend/` (via `create-next-app`)
- Modify: `frontend/app/globals.css`, `frontend/tailwind.config.ts` (via shadcn init)

**Interfaces:**
- Produces: project Next.js kosong dengan Tailwind + shadcn/ui siap pakai, di mana Task 12-13 menambahkan halaman.

- [ ] **Step 1: Generate project**

```bash
cd "/Users/abdillah/Documents/Course/AI ENGINEER by Ruang Guru/Final projects"
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd frontend
npx shadcn@latest init -d
npx shadcn@latest add button card badge alert
```

- [ ] **Step 2: Verifikasi dev server jalan**

Run: `cd frontend && npm run dev`
Expected: server jalan di `http://localhost:3000`, halaman default Next.js muncul tanpa error di console.

- [ ] **Step 3: Commit**

```bash
git add frontend/
git commit -m "chore: scaffold Next.js frontend with shadcn/ui"
```

---

## Phase 1 — Basis Data RAG & Dummy Data

### Task 3: Ingestion Pipeline Dokumen Regulasi [CLAUDE]

**Files:**
- Create: `backend/scripts/download_regulations.py`
- Create: `backend/scripts/ingest_regulations.py`
- Create: `backend/data/regulations/` (folder tujuan PDF)

**Interfaces:**
- Produces: ChromaDB collection `"tax_regulations"` di `backend/data/chroma_db/`, tiap chunk punya metadata `{"source": "<nama file>", "regulation": "<nama regulasi>"}` — dipakai Task 8 (`query_regulations`).

- [ ] **Step 1: Script download 5 dokumen regulasi**

```python
# backend/scripts/download_regulations.py
import httpx
from pathlib import Path

REGULATIONS = {
    "uu-hpp-2021.pdf": "https://www.pajak.go.id/sites/default/files/2021-12/Salinan%20UU%20Nomor%207%20Tahun%202021.pdf",
    "petunjuk-teknis-faktur-pajak-pmk131.pdf": "https://www.pajak.go.id/sites/default/files/lampiran/Petunjuk%20Teknis%20Pembuatan%20Faktur%20Pajak%20dan%20Dokumen%20Tertentu%20yang%20Kedudukannya%20Dipersamakan%20dengan%20Faktur%20Pajak%20serta%20Penerapan%20PMK%20131%20Tahun%202024.pdf",
    "sp4-pmk11-2025-dpp-nilai-lain.pdf": "https://pajak.go.id/sites/default/files/2025-02/SP-4%20PEMERINTAH%20TERBITKAN%20ATURAN%20DPP%20NILAI%20LAIN%20DAN%20BESARAN%20TERTENTU%20PPN.pdf",
}

DEST = Path(__file__).parent.parent / "data" / "regulations"


def download_all():
    DEST.mkdir(parents=True, exist_ok=True)
    with httpx.Client(follow_redirects=True, timeout=30) as client:
        for filename, url in REGULATIONS.items():
            resp = client.get(url)
            resp.raise_for_status()
            (DEST / filename).write_bytes(resp.content)
            print(f"Downloaded {filename} ({len(resp.content)} bytes)")


if __name__ == "__main__":
    download_all()
```

**Catatan implementasi:** PER-11/PJ/2025 dan dokumen Petunjuk Teknis lengkap kadang tidak tersedia sebagai link PDF langsung yang stabil — kalau URL di atas berubah/404 saat dieksekusi, cari ulang link resmi terbaru di pajak.go.id atau peraturan.bpk.go.id sebelum melanjutkan, jangan pakai sumber non-resmi.

- [ ] **Step 2: Script chunking + embedding ke ChromaDB**

```python
# backend/scripts/ingest_regulations.py
from pathlib import Path
import chromadb
from pypdf import PdfReader

DATA_DIR = Path(__file__).parent.parent / "data" / "regulations"
CHROMA_DIR = Path(__file__).parent.parent / "data" / "chroma_db"
CHUNK_SIZE = 1000  # karakter per chunk
CHUNK_OVERLAP = 150


def extract_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def chunk_text(text: str, size: int, overlap: int) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start : start + size])
        start += size - overlap
    return [c.strip() for c in chunks if c.strip()]


def ingest():
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_or_create_collection("tax_regulations")

    for pdf_path in DATA_DIR.glob("*.pdf"):
        text = extract_text(pdf_path)
        chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
        ids = [f"{pdf_path.stem}-{i}" for i in range(len(chunks))]
        metadatas = [{"source": pdf_path.name, "regulation": pdf_path.stem} for _ in chunks]
        collection.add(ids=ids, documents=chunks, metadatas=metadatas)
        print(f"Ingested {len(chunks)} chunks from {pdf_path.name}")


if __name__ == "__main__":
    ingest()
```

- [ ] **Step 3: Jalankan pipeline & verifikasi**

Run:
```bash
cd backend
python scripts/download_regulations.py
python scripts/ingest_regulations.py
python -c "import chromadb; c = chromadb.PersistentClient(path='data/chroma_db'); col = c.get_collection('tax_regulations'); print(col.count())"
```
Expected: jumlah chunk > 0 tercetak (bukan 0 atau error).

- [ ] **Step 4: Commit**

```bash
git add backend/scripts/ backend/data/regulations/
git commit -m "feat: ingest tax regulation PDFs into ChromaDB"
```

---

### Task 4: Dummy Faktur Pajak + Ground Truth [CLAUDE]

**Files:**
- Create: `backend/scripts/generate_dummy_faktur.py`
- Create: `backend/data/dummy_faktur/` (output gambar/PDF + `ground_truth.json`)

**Interfaces:**
- Produces: 8 file dummy faktur pajak (format gambar, dibuat dengan render HTML→image atau library gambar sederhana) + `ground_truth.json` berisi list objek `{"file": str, "expected": {...field sesuai ExtractedFakturData...}}` — dipakai Task 7 untuk mengukur akurasi ekstraksi.

- [ ] **Step 1: Rancang template & data dummy**

```python
# backend/scripts/generate_dummy_faktur.py
"""
Generate dummy faktur pajak (PNG) + ground truth JSON untuk testing extraction agent.
Data sepenuhnya fiktif — NPWP, nama perusahaan, dan nominal tidak merujuk entitas nyata.
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = Path(__file__).parent.parent / "data" / "dummy_faktur"

# 8 kasus: 5 "normal" (tarif & field benar), 3 sengaja salah (untuk Task 9/10)
CASES = [
    {
        "file": "faktur-01-normal-11persen.png",
        "expected": {
            "npwp_penjual": "01.234.567.8-901.000",
            "npwp_pembeli": "02.345.678.9-012.000",
            "tanggal_faktur": "2025-03-15",
            "nomor_seri_faktur": "010.001-25.00000001",
            "dpp": 10_000_000,
            "tarif_ppn": 11,
            "ppn_terutang": 1_100_000,
        },
        "note": "Tarif 11% masih valid untuk faktur Jan-Mar 2025 sesuai PER-1/PJ/2025 (masa transisi)",
    },
    {
        "file": "faktur-02-normal-12persen.png",
        "expected": {
            "npwp_penjual": "01.234.567.8-901.000",
            "npwp_pembeli": "03.456.789.0-123.000",
            "tanggal_faktur": "2025-06-10",
            "nomor_seri_faktur": "010.001-25.00000045",
            "dpp": 20_000_000,
            "tarif_ppn": 12,
            "ppn_terutang": 2_400_000,
        },
        "note": "Tarif 12% berlaku penuh setelah masa transisi berakhir",
    },
    # ... 3 kasus normal tambahan dengan variasi nominal/tanggal (ikuti pola di atas)
    {
        "file": "faktur-06-salah-tarif.png",
        "expected": {
            "npwp_penjual": "01.234.567.8-901.000",
            "npwp_pembeli": "04.567.890.1-234.000",
            "tanggal_faktur": "2025-07-01",
            "nomor_seri_faktur": "010.001-25.00000099",
            "dpp": 10_000_000,
            "tarif_ppn": 10,  # SENGAJA SALAH — sudah tidak berlaku sejak UU HPP 2021/2022
            "ppn_terutang": 1_000_000,
        },
        "note": "KASUS UJI NEGATIF: tarif 10% sudah tidak berlaku, compliance agent harus flag ini",
    },
    {
        "file": "faktur-07-salah-nsfp.png",
        "expected": {
            "npwp_penjual": "01.234.567.8-901.000",
            "npwp_pembeli": "05.678.901.2-345.000",
            "tanggal_faktur": "2025-08-01",
            "nomor_seri_faktur": "12345",  # SENGAJA SALAH — bukan format 17 digit
            "dpp": 5_000_000,
            "tarif_ppn": 12,
            "ppn_terutang": 600_000,
        },
        "note": "KASUS UJI NEGATIF: format NSFP tidak sesuai 17 digit, compliance agent harus flag ini",
    },
    {
        "file": "faktur-08-salah-hitung.png",
        "expected": {
            "npwp_penjual": "01.234.567.8-901.000",
            "npwp_pembeli": "06.789.012.3-456.000",
            "tanggal_faktur": "2025-08-05",
            "nomor_seri_faktur": "010.001-25.00000123",
            "dpp": 10_000_000,
            "tarif_ppn": 12,
            "ppn_terutang": 1_000_000,  # SENGAJA SALAH — seharusnya 1.200.000 (12% x DPP)
        },
        "note": "KASUS UJI NEGATIF: PPN terutang tidak konsisten dengan DPP x tarif",
    },
]


def render_faktur_image(case: dict, out_path: Path):
    img = Image.new("RGB", (800, 600), color="white")
    draw = ImageDraw.Draw(img)
    font = ImageFont.load_default()
    y = 20
    draw.text((20, y), "FAKTUR PAJAK", font=font, fill="black")
    y += 40
    for key, value in case["expected"].items():
        draw.text((20, y), f"{key}: {value}", font=font, fill="black")
        y += 30
    img.save(out_path)


def generate_all():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ground_truth = []
    for case in CASES:
        render_faktur_image(case, OUT_DIR / case["file"])
        ground_truth.append(case)
    (OUT_DIR / "ground_truth.json").write_text(json.dumps(ground_truth, indent=2))
    print(f"Generated {len(CASES)} dummy faktur + ground_truth.json")


if __name__ == "__main__":
    generate_all()
```

**Catatan:** template render di atas sengaja sederhana (teks polos, bukan tiruan visual faktur pajak resmi) — cukup untuk menguji kemampuan LLM vision membaca field terstruktur. Lengkapi `CASES` jadi 8 total (5 normal + 3 kasus negatif sudah ada di atas) dengan variasi nominal/tanggal sebelum lanjut ke Task 7.

- [ ] **Step 2: Jalankan & verifikasi**

Run: `cd backend && pip install pillow && python scripts/generate_dummy_faktur.py`
Expected: 8 file gambar + `ground_truth.json` muncul di `backend/data/dummy_faktur/`

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/generate_dummy_faktur.py backend/data/dummy_faktur/
git commit -m "feat: generate dummy faktur pajak test fixtures with ground truth"
```

---

## Phase 2 — Extraction Agent

### Task 5: Data Contract Ekstraksi [CLAUDE]

**Files:**
- Create: `backend/app/models.py`

**Interfaces:**
- Produces: `ExtractedField[T]` (generic, punya `value: T | None` dan `confidence: Literal["high","medium","low"]`), `ExtractedFakturData` (semua field faktur, tiap field bertipe `ExtractedField`), `ExtractionResult` (`data: ExtractedFakturData`, `readable: bool`, `warning: str | None`) — dipakai Task 6 (return type) dan Task 9 (input type).

- [ ] **Step 1: Definisikan schema**

```python
# backend/app/models.py
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
```

- [ ] **Step 2: Test schema valid**

```python
# backend/tests/test_models.py
from app.models import ExtractedField, ExtractedFakturData, ExtractionResult


def test_extraction_result_with_null_field():
    data = ExtractedFakturData(
        npwp_penjual=ExtractedField(value="01.234.567.8-901.000", confidence="high"),
        npwp_pembeli=ExtractedField(value=None, confidence="low"),
        tanggal_faktur=ExtractedField(value="2025-03-15", confidence="high"),
        nomor_seri_faktur=ExtractedField(value="010.001-25.00000001", confidence="high"),
        dpp=ExtractedField(value=10_000_000, confidence="high"),
        tarif_ppn=ExtractedField(value=11, confidence="high"),
        ppn_terutang=ExtractedField(value=1_100_000, confidence="high"),
    )
    result = ExtractionResult(readable=True, warning="npwp_pembeli tidak terbaca jelas", data=data)
    assert result.data.npwp_pembeli.value is None
    assert result.data.npwp_pembeli.confidence == "low"
```

Run: `cd backend && pytest tests/test_models.py -v`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add backend/app/models.py backend/tests/test_models.py
git commit -m "feat: define extraction and compliance data contracts"
```

---

### Task 6: Prompt & Logic Extraction Agent [USER]

> **Kenapa ini bagian kamu:** ini keputusan inti yang menentukan reliabilitas seluruh sistem — bagaimana caranya "memaksa" LLM vision untuk **jujur mengaku tidak yakin** alih-alih menebak field yang buram. Ini juga poin yang paling akan ditanya saat sidang skripsi ("kenapa sistemnya bisa dipercaya?"), jadi harus benar-benar kamu pahami, bukan hasil tempel dari AI.

**Files:**
- Create: `backend/app/extraction_agent.py`
- Test: `backend/tests/test_extraction_agent.py`

**Interfaces:**
- Consumes: `anthropic.Anthropic` client (dari `app.config.settings.anthropic_api_key`), `ExtractedFakturData`/`ExtractionResult` (Task 5)
- Produces: `extract_faktur_data(image_bytes: bytes, media_type: str) -> ExtractionResult` — dipakai Task 11 (endpoint) dan Task 7 (test akurasi)

**Signature yang harus kamu implementasikan:**

```python
# backend/app/extraction_agent.py
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
```

**Pertimbangan yang perlu kamu pikirkan (bukan jawaban siap pakai):**
- Claude vision menerima gambar sebagai base64 di content block `{"type": "image", "source": {...}}` — cek dokumentasi Anthropic API untuk format terbaru.
- Kalau kamu pakai "minta model output JSON di teks", kamu perlu strategi parsing yang tahan terhadap model yang kadang membungkus JSON dengan teks tambahan (```json ... ``` misalnya).
- Kalau kamu pakai tool use / structured output, konsistensi schema lebih terjamin tapi butuh definisi tool schema terpisah dari Pydantic model — pikirkan apakah worth it untuk 1 model kecil ini.

- [ ] **Step 1: Tulis test dulu (TDD)** — pakai salah satu file dummy dari Task 4:

```python
# backend/tests/test_extraction_agent.py
import json
from pathlib import Path
from app.extraction_agent import extract_faktur_data

DUMMY_DIR = Path(__file__).parent.parent / "data" / "dummy_faktur"


def test_extract_normal_faktur():
    image_bytes = (DUMMY_DIR / "faktur-01-normal-11persen.png").read_bytes()
    result = extract_faktur_data(image_bytes, media_type="image/png")

    assert result.readable is True
    assert result.data is not None
    assert result.data.tarif_ppn.value == 11
    assert result.data.tarif_ppn.confidence in ("high", "medium")
```

- [ ] **Step 2: Jalankan test, pastikan FAIL** (karena masih `raise NotImplementedError`)

Run: `cd backend && pytest tests/test_extraction_agent.py -v`
Expected: FAIL dengan `NotImplementedError`

- [ ] **Step 3: Implementasikan `extract_faktur_data`** sesuai pertimbangan di atas.

- [ ] **Step 4: Jalankan test lagi**

Run: `cd backend && pytest tests/test_extraction_agent.py -v`
Expected: PASS. Kalau gagal karena model salah baca (bukan bug kode), catat di `docs/superpowers/proses_extraction_agent.md` — ini bagian dari proses belajar yang layak didokumentasikan (ikuti gaya dokumentasi proyek bean classifier-mu sebelumnya).

- [ ] **Step 5: Commit**

```bash
git add backend/app/extraction_agent.py backend/tests/test_extraction_agent.py
git commit -m "feat: implement faktur pajak extraction agent"
```

---

### Task 7: Uji Akurasi Extraction Agent [USER]

**Files:**
- Create: `backend/scripts/eval_extraction.py`
- Create: `docs/superpowers/eval-results/extraction-accuracy.md`

**Interfaces:**
- Consumes: `extract_faktur_data` (Task 6), `backend/data/dummy_faktur/ground_truth.json` (Task 4)

- [ ] **Step 1: Tulis script evaluasi** — bandingkan tiap field hasil ekstraksi vs `ground_truth.json` untuk 5 kasus "normal" (bukan yang sengaja salah — itu untuk Task 9/10), hitung persentase field yang cocok persis.

- [ ] **Step 2: Jalankan & catat hasilnya**

Run: `cd backend && python scripts/eval_extraction.py`

- [ ] **Step 3: Tulis `docs/superpowers/eval-results/extraction-accuracy.md`** — dokumentasikan: berapa akurasi per field, field mana yang paling sering salah/kenapa (mis. format tanggal ambigu, angka desimal), dan apa yang sudah/belum kamu perbaiki. Ini penting sebagai bukti evaluasi yang jujur untuk penilaian.

- [ ] **Step 4: Commit**

```bash
git add backend/scripts/eval_extraction.py docs/superpowers/eval-results/extraction-accuracy.md
git commit -m "test: evaluate extraction agent accuracy against ground truth"
```

---

## Phase 3 — Compliance Agent

### Task 8: Utility Query RAG [CLAUDE]

**Files:**
- Create: `backend/app/rag.py`
- Test: `backend/tests/test_rag.py`

**Interfaces:**
- Produces: `query_regulations(query: str, n_results: int = 3) -> list[dict]` (tiap dict: `{"text": str, "source": str, "regulation": str}`) — dipakai Task 9.

- [ ] **Step 1: Implementasi**

```python
# backend/app/rag.py
import chromadb
from app.config import settings

_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
_collection = _client.get_or_create_collection("tax_regulations")


def query_regulations(query: str, n_results: int = 3) -> list[dict]:
    results = _collection.query(query_texts=[query], n_results=n_results)
    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    return [
        {"text": doc, "source": meta["source"], "regulation": meta["regulation"]}
        for doc, meta in zip(documents, metadatas)
    ]
```

- [ ] **Step 2: Test**

```python
# backend/tests/test_rag.py
from app.rag import query_regulations


def test_query_returns_relevant_chunks():
    results = query_regulations("tarif PPN barang mewah 2025", n_results=3)
    assert len(results) > 0
    assert all("source" in r for r in results)
```

Run: `cd backend && pytest tests/test_rag.py -v`
Expected: PASS (butuh Task 3 sudah dijalankan agar ChromaDB terisi)

- [ ] **Step 3: Commit**

```bash
git add backend/app/rag.py backend/tests/test_rag.py
git commit -m "feat: add regulation retrieval utility"
```

---

### Task 9: Prompt & Logic Compliance Agent [USER]

> **Kenapa ini bagian kamu:** ini yang menentukan apakah sistem benar-benar "RAG yang jujur" atau cuma LLM yang sok tahu. Kamu harus memutuskan sendiri kapan sistem boleh bilang "sesuai", kapan harus bilang "tidak yakin", dan bagaimana caranya jawaban selalu bisa dilacak ke pasal/dokumen sumbernya.

**Files:**
- Create: `backend/app/compliance_agent.py`
- Test: `backend/tests/test_compliance_agent.py`

**Interfaces:**
- Consumes: `ExtractedFakturData` (Task 5), `query_regulations` (Task 8), `anthropic.Anthropic` client
- Produces: `check_compliance(data: ExtractedFakturData) -> ComplianceReport` — dipakai Task 11 (endpoint)

**Signature yang harus kamu implementasikan:**

```python
# backend/app/compliance_agent.py
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
```

- [ ] **Step 1: Tulis test dulu** — pakai kasus normal DAN kasus negatif dari Task 4/9:

```python
# backend/tests/test_compliance_agent.py
from app.compliance_agent import check_compliance
from app.extraction_agent import extract_faktur_data
from pathlib import Path

DUMMY_DIR = Path(__file__).parent.parent / "data" / "dummy_faktur"


def test_normal_faktur_is_compliant():
    image_bytes = (DUMMY_DIR / "faktur-02-normal-12persen.png").read_bytes()
    extraction = extract_faktur_data(image_bytes, media_type="image/png")
    report = check_compliance(extraction.data)
    assert report.status == "compliant"


def test_wrong_tarif_is_flagged():
    image_bytes = (DUMMY_DIR / "faktur-06-salah-tarif.png").read_bytes()
    extraction = extract_faktur_data(image_bytes, media_type="image/png")
    report = check_compliance(extraction.data)
    assert report.status == "flagged"
    assert any("tarif" in issue.field for issue in report.issues)
    assert len(report.sources_used) > 0
```

- [ ] **Step 2: Jalankan, pastikan FAIL dulu** (karena `NotImplementedError`)

- [ ] **Step 3: Implementasikan `check_compliance`**

- [ ] **Step 4: Jalankan test lagi**

Run: `cd backend && pytest tests/test_compliance_agent.py -v`
Expected: PASS untuk kedua test

- [ ] **Step 5: Commit**

```bash
git add backend/app/compliance_agent.py backend/tests/test_compliance_agent.py
git commit -m "feat: implement tax compliance checking agent with RAG"
```

---

### Task 10: Uji Kasus Negatif Lengkap [USER]

**Files:**
- Modify: `backend/tests/test_compliance_agent.py` (tambah 2 test case lagi)
- Create: `docs/superpowers/eval-results/compliance-accuracy.md`

- [ ] **Step 1: Tambahkan test untuk `faktur-07-salah-nsfp.png` dan `faktur-08-salah-hitung.png`** (pola sama seperti `test_wrong_tarif_is_flagged`)

- [ ] **Step 2: Jalankan semua test compliance**

Run: `cd backend && pytest tests/test_compliance_agent.py -v`
Expected: semua PASS. Kalau ada kasus yang lolos padahal seharusnya di-flag, ini bug logic (bukan infra) — perbaiki prompt/logic Task 9, bukan test-nya.

- [ ] **Step 3: Dokumentasikan hasil evaluasi** di `docs/superpowers/eval-results/compliance-accuracy.md` — mana yang berhasil dideteksi, mana yang masih lolos dan kenapa (kalau ada), apa perbaikan yang sudah dicoba.

- [ ] **Step 4: Commit**

```bash
git add backend/tests/test_compliance_agent.py docs/superpowers/eval-results/compliance-accuracy.md
git commit -m "test: cover additional non-compliance scenarios"
```

---

## Phase 4 — Integrasi Backend

### Task 11: Endpoint & Orchestration [CLAUDE]

**Files:**
- Create: `backend/app/orchestrator.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_analyze_endpoint.py`

**Interfaces:**
- Consumes: `extract_faktur_data` (Task 6), `check_compliance` (Task 9)
- Produces: `POST /api/analyze-faktur` — request: `multipart/form-data` file upload; response JSON: `{"extraction": ExtractionResult, "compliance": ComplianceReport | null}`

- [ ] **Step 1: Orchestrator**

```python
# backend/app/orchestrator.py
from app.extraction_agent import extract_faktur_data
from app.compliance_agent import check_compliance
from app.models import ExtractionResult, ComplianceReport


def analyze_faktur(image_bytes: bytes, media_type: str) -> tuple[ExtractionResult, ComplianceReport | None]:
    extraction = extract_faktur_data(image_bytes, media_type)
    if not extraction.readable or extraction.data is None:
        return extraction, None
    compliance = check_compliance(extraction.data)
    return extraction, compliance
```

- [ ] **Step 2: Endpoint di `main.py`**

```python
# tambahkan ke backend/app/main.py
from fastapi import UploadFile, File, HTTPException
from app.orchestrator import analyze_faktur

ALLOWED_TYPES = {"image/png", "image/jpeg"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10MB


@app.post("/api/analyze-faktur")
async def analyze_faktur_endpoint(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Format {file.content_type} tidak didukung. Gunakan PNG/JPEG.")

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Ukuran file melebihi 10MB.")

    try:
        extraction, compliance = analyze_faktur(contents, file.content_type)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gagal memproses dokumen: {exc}") from exc

    return {"extraction": extraction, "compliance": compliance}
```

- [ ] **Step 3: Test end-to-end**

```python
# backend/tests/test_analyze_endpoint.py
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
DUMMY_DIR = Path(__file__).parent.parent / "data" / "dummy_faktur"


def test_analyze_faktur_normal_case():
    image_path = DUMMY_DIR / "faktur-02-normal-12persen.png"
    with open(image_path, "rb") as f:
        response = client.post(
            "/api/analyze-faktur",
            files={"file": ("faktur.png", f, "image/png")},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["extraction"]["readable"] is True
    assert body["compliance"]["status"] == "compliant"


def test_analyze_faktur_rejects_unsupported_format():
    response = client.post(
        "/api/analyze-faktur",
        files={"file": ("faktur.txt", b"bukan gambar", "text/plain")},
    )
    assert response.status_code == 400
```

Run: `cd backend && pytest tests/test_analyze_endpoint.py -v`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add backend/app/orchestrator.py backend/app/main.py backend/tests/test_analyze_endpoint.py
git commit -m "feat: wire extraction and compliance agents into analyze endpoint"
```

---

## Phase 5 — Frontend

### Task 12: API Client & Tipe [CLAUDE]

**Files:**
- Create: `frontend/lib/api.ts`
- Create: `frontend/lib/types.ts`

**Interfaces:**
- Produces: `analyzeFaktur(file: File): Promise<AnalyzeResponse>`, tipe `AnalyzeResponse` (cermin dari response backend Task 11) — dipakai Task 13.

- [ ] **Step 1: Definisikan tipe**

```typescript
// frontend/lib/types.ts
export type Confidence = "high" | "medium" | "low";

export interface ExtractedField<T> {
  value: T | null;
  confidence: Confidence;
}

export interface ExtractedFakturData {
  npwp_penjual: ExtractedField<string>;
  npwp_pembeli: ExtractedField<string>;
  tanggal_faktur: ExtractedField<string>;
  nomor_seri_faktur: ExtractedField<string>;
  dpp: ExtractedField<number>;
  tarif_ppn: ExtractedField<number>;
  ppn_terutang: ExtractedField<number>;
}

export interface ExtractionResult {
  readable: boolean;
  warning: string | null;
  data: ExtractedFakturData | null;
}

export interface ComplianceIssue {
  field: string;
  message: string;
  regulation_source: string;
}

export interface ComplianceReport {
  status: "compliant" | "flagged" | "inconclusive";
  issues: ComplianceIssue[];
  sources_used: string[];
}

export interface AnalyzeResponse {
  extraction: ExtractionResult;
  compliance: ComplianceReport | null;
}
```

- [ ] **Step 2: API client**

```typescript
// frontend/lib/api.ts
import type { AnalyzeResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function analyzeFaktur(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/analyze-faktur`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Terjadi kesalahan tidak diketahui" }));
    throw new Error(body.detail ?? `Request gagal dengan status ${response.status}`);
  }

  return response.json();
}
```

- [ ] **Step 3: Buat `frontend/.env.local.example`**

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

- [ ] **Step 4: Commit**

```bash
git add frontend/lib/ frontend/.env.local.example
git commit -m "feat: add API client and shared types for frontend"
```

---

### Task 13: Halaman Upload & Hasil [USER]

> **Kenapa ini bagian kamu:** ini showcase kekuatanmu sebagai frontend developer — desain UX untuk menampilkan hasil AI (termasuk status "tidak yakin"/"perlu ditinjau") dengan jelas itu keputusan produk, bukan cuma soal styling.

**Files:**
- Create: `frontend/app/page.tsx`
- Create: `frontend/components/upload-form.tsx`
- Create: `frontend/components/analysis-result.tsx`

**Interfaces:**
- Consumes: `analyzeFaktur` (Task 12), tipe dari `frontend/lib/types.ts` (Task 12)

**Yang perlu kamu putuskan & bangun:**
1. `upload-form.tsx` — komponen upload file (drag-drop atau file input biasa), state loading saat request berjalan, tampilkan pesan error kalau `analyzeFaktur` throw.
2. `analysis-result.tsx` — menampilkan hasil `AnalyzeResponse`:
   - Data hasil ekstraksi per field, dengan indikator visual berbeda untuk `confidence: "low"` (misal warna kuning/badge peringatan) vs `"high"`
   - Kalau `extraction.readable === false` — tampilkan warning yang jelas, jangan render compliance report (karena `compliance` akan `null`)
   - Status compliance (`compliant`/`flagged`/`inconclusive`) dengan warna berbeda (hijau/merah/abu-abu), daftar `issues` kalau ada, dan `sources_used` sebagai referensi (transparansi — user harus bisa lihat dasar keputusan sistem)
3. `page.tsx` — gabungkan kedua komponen di atas dalam satu halaman.

Referensi komponen shadcn yang sudah ter-install dari Task 2: `Button`, `Card`, `Badge`, `Alert` — pakai sesuai kebutuhan, boleh tambah komponen shadcn lain kalau perlu (`npx shadcn@latest add <nama>`).

- [ ] **Step 1: Bangun `upload-form.tsx`**

- [ ] **Step 2: Bangun `analysis-result.tsx`**

- [ ] **Step 3: Rangkai di `page.tsx`**

- [ ] **Step 4: Test manual di browser**

Run: `cd backend && uvicorn app.main:app --reload` (terminal 1), `cd frontend && npm run dev` (terminal 2)
Expected: buka `http://localhost:3000`, upload salah satu dummy faktur dari `backend/data/dummy_faktur/`, hasil ekstraksi + compliance muncul tanpa error di console browser.

- [ ] **Step 5: Commit**

```bash
git add frontend/app/page.tsx frontend/components/
git commit -m "feat: build upload and analysis result UI"
```

---

## Phase 6 — Deployment

### Task 14: Deploy Backend & Frontend [CLAUDE — guide interaktif]

**Files:**
- Create: `backend/Procfile` atau `backend/railway.toml` (sesuai platform yang dipilih)
- Create: `frontend/.env.production` (via dashboard Vercel, bukan file di repo)

- [ ] **Step 1: Deploy backend ke Railway/Render**
  - Push repo ke GitHub (perlu buat repo baru dulu kalau belum ada)
  - Hubungkan ke Railway/Render, set root directory `backend/`, set environment variable `ANTHROPIC_API_KEY`
  - Pastikan `backend/data/chroma_db/` ikut ter-deploy (di-generate ulang via `ingest_regulations.py` sebagai build step, atau di-commit langsung — pertimbangkan ukurannya)
  - Catat URL backend yang di-deploy

- [ ] **Step 2: Deploy frontend ke Vercel**
  - Hubungkan repo ke Vercel, set root directory `frontend/`
  - Set environment variable `NEXT_PUBLIC_API_BASE_URL` ke URL backend dari Step 1
  - Update CORS di `backend/app/main.py` (`allow_origins`) agar hanya mengizinkan domain Vercel, bukan `"*"`

- [ ] **Step 3: Verifikasi end-to-end di URL publik**

Expected: upload faktur dummy di URL Vercel, hasil analisis muncul benar, tidak ada CORS error di console.

- [ ] **Step 4: Commit config deployment**

```bash
git add backend/Procfile  # atau file config platform yang dipakai
git commit -m "chore: add deployment configuration"
```

---

## Phase 7 — Dokumentasi Akhir

### Task 15: README & Ringkasan Proyek [USER]

**Files:**
- Create: `README.md`

Ikuti gaya dokumentasi proyek CV-mu sebelumnya (`portofolio_bean_classifier.md`) — jelaskan latar belakang, keputusan teknis penting dan alasannya, tantangan yang dihadapi, hasil evaluasi (rujuk `docs/superpowers/eval-results/`), dan link demo. Ini dokumen yang paling mungkin dibaca reviewer bootcamp maupun dosen pembimbing skripsi.

- [ ] **Step 1: Tulis README.md**
- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add project README"
```

---

## Self-Review Checklist

- **Spec coverage:** semua bagian spec (arsitektur 2-agent, RAG 5 dokumen, extraction+compliance flow, error handling fail-loud, testing, scope boundaries, deploy publik) sudah dipetakan ke task di atas.
- **Placeholder scan:** task `[CLAUDE]` tidak mengandung TODO/placeholder — kode lengkap. Task `[USER]` sengaja mengandung `NotImplementedError`/instruksi terbuka sesuai kesepakatan pembagian kerja (approach C) — ini disengaja, bukan plan yang belum selesai.
- **Type consistency:** `ExtractedFakturData`, `ExtractionResult`, `ComplianceReport` didefinisikan sekali di Task 5 dan dipakai konsisten di Task 6, 7, 9, 10, 11, 12, 13 tanpa berubah nama field.
