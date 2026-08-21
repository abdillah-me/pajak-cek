# Pajak-Cek — Ekstraksi & Cek Kepatuhan Faktur Pajak Otomatis

Final project **AI Engineer Bootcamp (Ruang Guru)** — web app yang membaca gambar Faktur Pajak Indonesia, mengekstrak datanya secara otomatis, lalu mengecek kesesuaiannya terhadap regulasi PPN terkini.

**Demo:** [pajak-cek.vercel.app](https://pajak-cek.vercel.app)

## Latar Belakang

Idenya lahir dari pengalaman saya bekerja di konsultan pajak (background D3 Akuntansi) sebelum pindah ke software engineering. Staff junior di sana sering menghadapi kerjaan repetitif dan rawan human error: input ulang data faktur pajak secara manual, lalu memastikan tarif/field-nya sesuai regulasi yang sering berubah — contoh nyata yang saya alami langsung: transisi tarif PPN 11% → 12% di 2025.

Topik ini juga jadi fondasi untuk skripsi Sistem Informasi saya di Binus ("Pengembangan Sistem Informasi Manajemen Operasional Konsultan Pajak Berbasis Web dengan Fitur Otomasi Kecerdasan Buatan") — jadi final project bootcamp ini sekaligus jadi prototipe fitur AI yang skripsi saya butuhkan.

## Yang Dilakukan Sistem

1. User upload gambar Faktur Pajak (PNG/JPEG)
2. **Extraction Agent** (Claude vision) membaca gambar dan mengekstrak 7 field terstruktur: NPWP penjual/pembeli, tanggal faktur, nomor seri faktur, DPP, tarif PPN, PPN terutang — masing-masing dengan skor confidence
3. **Compliance Agent** mengecek data hasil ekstraksi terhadap regulasi PPN resmi (RAG atas ChromaDB) dan aturan matematis (format nomor seri, konsistensi perhitungan PPN)
4. Frontend menampilkan hasil ekstraksi + status kepatuhan (`compliant` / `flagged` / `inconclusive`) beserta kutipan sumber regulasi yang jadi dasar penilaian

## Tech Stack

| Komponen | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) + Tailwind CSS + shadcn/ui |
| Backend | Python FastAPI |
| LLM | Claude (`claude-opus-5`) via Anthropic SDK — vision untuk ekstraksi, structured output untuk kedua agent |
| RAG / Vector Store | ChromaDB (lokal, persisted) |
| Testing | pytest (backend), eval script manual untuk akurasi ekstraksi & compliance |

## Keputusan Teknis & Alasannya

### Kenapa 2 agent terpisah, bukan 1 prompt besar?

Kalau digabung jadi satu prompt raksasa, LLM harus sekaligus "melihat gambar" DAN "mengingat semua aturan pajak" DAN "menyimpulkan kepatuhan" — ini menurunkan reliabilitas dan menyulitkan debugging (kalau hasilnya salah, apakah ekstraksinya yang salah, atau pemahaman aturannya?). Dengan dipecah jadi Extraction Agent dan Compliance Agent, tiap tahap bisa divalidasi independen dan sistemnya lebih auditable.

### Kenapa orchestration Python manual, bukan LangGraph/CrewAI?

Alur kerjanya linear — ekstrak, lalu cek kepatuhan, lalu gabungkan hasil. Tidak ada percabangan logic dinamis yang butuh agent memutuskan sendiri tool mana yang dipanggil. Pakai framework agent di sini cuma menambah lapisan abstraksi tanpa manfaat nyata (YAGNI) dan bikin lebih susah men-debug apa yang benar-benar terjadi di setiap langkah.

### Kenapa sebagian compliance check deterministik, bukan semuanya lewat LLM?

Compliance Agent membagi tugas berdasarkan sifat masalahnya:
- **Format nomor seri faktur** dan **konsistensi perhitungan PPN** (DPP × tarif = PPN terutang) dicek dengan kode Python biasa (regex & aritmatika) — ini aturan mekanis yang punya jawaban pasti, memakai LLM di sini cuma menambah biaya dan risiko halusinasi tanpa manfaat.
- **Validitas tarif PPN terhadap tanggal faktur** dicek lewat RAG + LLM — karena ini butuh reasoning atas teks regulasi yang berubah dari waktu ke waktu (transisi 11%→12%), jawabannya tidak bisa di-hardcode.

### Prinsip "fail loud, jangan mengarang"

Di domain pajak, LLM yang mengarang data (halusinasi) bukan cuma bug teknis — itu risiko kredibilitas. Karena itu:
- Setiap field ekstraksi punya `confidence` (`high`/`medium`/`low`). Kalau model tidak yakin, dia diinstruksikan mengisi `null` + `low`, bukan menebak.
- Kalau RAG tidak menemukan dokumen regulasi yang relevan untuk suatu pertanyaan, Compliance Agent mengembalikan status `inconclusive` — bukan menjawab dari pengetahuan umum model (yang berisiko memakai tarif lama yang sudah tidak berlaku).
- Struktur output dijamin lewat `client.messages.parse()` dari Anthropic SDK dengan schema Pydantic (`output_format=...`), jadi respons yang tidak valid akan gagal secara eksplisit, bukan diam-diam dilanjutkan dengan data rusak.

## Hasil Evaluasi

Evaluasi lengkap ada di `docs/superpowers/eval-results/`. Ringkasannya:

- **Extraction accuracy**: 35/35 field (100%) cocok dengan ground truth pada 5 dummy faktur "normal". *Catatan jujur*: dataset ini sintetis (gambar bersih, bukan hasil scan/foto asli) — akurasi 100% di sini tidak menjamin performa sama di foto faktur dunia nyata yang lebih bervariasi kualitasnya. Detail: [`extraction-accuracy.md`](docs/superpowers/eval-results/extraction-accuracy.md)
- **Compliance detection**: 4/4 kasus terklasifikasi benar — 1 kasus normal tetap `compliant`, 3 kasus uji negatif (tarif tidak berlaku, format NSFP salah, perhitungan PPN tidak konsisten) semuanya ter-`flagged` dengan alasan yang merujuk teks regulasi spesifik hasil retrieval. Detail: [`compliance-accuracy.md`](docs/superpowers/eval-results/compliance-accuracy.md)

## Tantangan yang Dihadapi

**1. Memutuskan mana yang layak dijawab LLM, mana yang cukup kode biasa**
Godaan pertama waktu desain Compliance Agent adalah menyerahkan semua pengecekan ke LLM sekaligus (termasuk format nomor seri dan perhitungan matematis). Setelah dipikir ulang, itu keputusan yang salah — untuk aturan yang punya jawaban pasti dan mekanis, LLM cuma menambah biaya, latensi, dan risiko halusinasi tanpa manfaat apa pun. Solusinya: pisahkan berdasarkan apakah suatu aturan butuh *interpretasi teks regulasi yang bisa berubah* (butuh RAG+LLM) atau *aturan tetap yang tidak butuh interpretasi* (cukup regex/aritmatika Python).

**2. Struktur output yang reliabel dari LLM**
Awalnya draft desain mempertimbangkan minta LLM mengembalikan JSON lewat instruksi prompt saja, lalu di-parse manual — tapi ini rawan gagal parse kalau modelnya menambahkan teks di luar JSON. Solusinya: pakai `client.messages.parse()` dengan `output_format` berupa model Pydantic, yang menjamin response tervalidasi terhadap schema di sisi API, tanpa perlu retry-parsing manual.

**3. Setup shadcn/ui gagal karena flag CLI yang sudah tidak valid**
`npx shadcn@latest init -d --base-color neutral` gagal dengan `error: unknown option '--base-color'` dan diam-diam keluar tanpa membuat `components.json`. Ternyata versi CLI yang terpasang tidak lagi mendukung flag itu. Solusinya sederhana setelah ditemukan: jalankan ulang tanpa flag tersebut.

**4. File contoh environment variable frontend tidak ikut ter-track git**
`frontend/.env.local.example` ternyata dikecualikan oleh `.gitignore` bawaan `create-next-app` (pola `.env*` yang menyapu semua file berawalan `.env`, termasuk yang seharusnya jadi dokumentasi publik). Ditemukan lewat `git check-ignore -v`, di-fix dengan `git add -f` khusus untuk file itu.

**5. Regulasi yang berhasil diunduh cuma 3 dari 5 yang direncanakan di spec awal**
UU HPP 2021, Petunjuk Teknis Faktur Pajak (PMK 131/2024), dan SP-4 PMK 11/2025 berhasil diunduh dan di-ingest (430 chunks). PER-11/PJ/2025 tidak berhasil didapatkan dalam bentuk PDF resmi yang bisa diunduh langsung dalam waktu yang tersedia — ini pengurangan scope yang disengaja demi memenuhi deadline, dicatat di sini secara jujur alih-alih disembunyikan.

## Yang Saya Pelajari

- **Pemisahan tanggung jawab antar-agent bukan cuma soal arsitektur yang rapi** — itu langsung berdampak ke seberapa mudah men-debug ketika hasilnya salah. Kalau satu prompt melakukan semuanya, saya tidak akan tahu apakah masalahnya di pembacaan gambar atau di pemahaman regulasi.
- **Tidak semua masalah "AI" harus diselesaikan dengan LLM.** Godaan untuk memakai LLM di mana-mana itu nyata, tapi untuk aturan yang punya jawaban pasti (format, aritmatika), kode biasa lebih murah, lebih cepat, dan 100% konsisten.
- **"Mengaku tidak tahu" adalah fitur, bukan kekurangan** — terutama di domain yang keputusannya berdampak nyata (pajak). Status `inconclusive` sengaja dirancang sebagai jawaban yang valid, bukan cuma `compliant`/`flagged`.

## Scope Boundaries

**In scope:** 1 jenis dokumen (Faktur Pajak), upload single file, 3 dokumen regulasi sebagai basis RAG, ekstraksi + compliance check + laporan hasil di UI.

**Out of scope** (lanjutan untuk skripsi, bukan bagian final project bootcamp ini): jenis dokumen pajak lain (bukti potong PPh, SPT), riwayat/histori upload per user, autentikasi/login, upload multi-dokumen batch, fitur tracking deadline klien.

## Menjalankan Secara Lokal

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env  # isi ANTHROPIC_API_KEY
python scripts/download_regulations.py   # sekali saja
python scripts/ingest_regulations.py     # sekali saja
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local  # default sudah mengarah ke localhost:8000
npm run dev
```

### Test & Evaluasi

```bash
cd backend
pytest tests/ -v
python scripts/eval_extraction.py
```
