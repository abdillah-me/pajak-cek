<!--
Draft presentasi final project — format Markdown dengan pemisah slide (---),
kompatibel dengan Marp / reveal-md / Slidev kalau mau di-render jadi slide visual.
Isi diambil dari README.md dan docs/superpowers/eval-results/ (angka nyata, bukan estimasi).
-->

# Pajak-Cek
### Ekstraksi & Cek Kepatuhan Faktur Pajak Otomatis

**AI Engineer Bootcamp — Final Project**
[github.com/abdillah-me/pajak-cek](https://github.com/abdillah-me/pajak-cek)
Demo: [pajak-cek.vercel.app](https://pajak-cek.vercel.app)

---

## Objective

Membantu staff junior konsultan pajak memvalidasi Faktur Pajak klien dengan cepat — tanpa harus hafal semua PMK/PER terbaru — dengan cara:

1. **Mengekstrak** data terstruktur dari gambar faktur pajak (NPWP, tanggal, DPP, tarif PPN, PPN terutang, nomor seri) secara otomatis
2. **Mengecek kepatuhan** data tersebut terhadap regulasi PPN resmi yang berlaku

---

## Latar Belakang

- Pengalaman pribadi bekerja di konsultan pajak (background D3 Akuntansi): input data faktur manual itu repetitif dan rawan human error
- Contoh nyata: transisi tarif PPN 11% → 12% di 2025 — staff junior sering tidak update dengan perubahan tarif
- Topik ini juga jadi fondasi skripsi Sistem Informasi (Binus) — final project bootcamp ini adalah prototipe fitur AI-nya

---

## Deskripsi Model / Sistem

Bukan satu model, tapi **2 agent terpisah** yang di-orchestrate secara linear:

```
Upload gambar → Extraction Agent (Claude vision) → data terstruktur
             → Compliance Agent (RAG + rule-based) → status kepatuhan
             → Response gabungan ke frontend
```

- **Extraction Agent**: Claude (`claude-opus-5`), vision + structured output (`messages.parse` dengan schema Pydantic)
- **Compliance Agent**: hybrid — RAG (ChromaDB) untuk validitas tarif PPN (butuh interpretasi regulasi), ditambah pengecekan deterministik (regex, aritmatika) untuk format nomor seri & konsistensi perhitungan

---

## Kenapa Arsitektur Ini? (1)

**2 agent terpisah, bukan 1 prompt besar**

Kalau digabung, LLM harus sekaligus "melihat gambar" + "mengingat aturan pajak" + "menyimpulkan kepatuhan" dalam satu langkah — menurunkan reliabilitas dan menyulitkan debugging. Dipisah → tiap tahap bisa divalidasi independen.

**Orchestration Python manual, bukan LangGraph/CrewAI**

Alurnya linear (extract → check → gabung), tidak ada percabangan keputusan dinamis. Framework agent di sini cuma nambah abstraksi tanpa manfaat (YAGNI).

---

## Kenapa Arsitektur Ini? (2)

**Sebagian compliance check deterministik, bukan semua lewat LLM**

| Check | Cara | Alasan |
|---|---|---|
| Format nomor seri faktur | Regex (Python) | Aturan mekanis, jawaban pasti |
| Konsistensi DPP × tarif = PPN | Aritmatika (Python) | Aturan mekanis, jawaban pasti |
| Validitas tarif vs tanggal faktur | RAG + LLM | Butuh interpretasi teks regulasi yang berubah dari waktu ke waktu |

Pakai LLM untuk aturan yang sudah pasti jawabannya = biaya + risiko halusinasi tanpa manfaat.

---

## Prinsip Desain: "Fail Loud, Jangan Mengarang"

Di domain pajak, LLM yang mengarang data bukan cuma bug — itu risiko kredibilitas.

- Tiap field ekstraksi punya **confidence** (`high`/`medium`/`low`) — tidak yakin → `null` + `low`, bukan tebakan
- RAG tidak menemukan regulasi relevan → status **`inconclusive`**, bukan menjawab dari pengetahuan umum model (risiko pakai tarif lama)
- Output dijamin valid lewat `client.messages.parse()` + schema Pydantic — response tidak valid gagal secara eksplisit

---

## Dataset

**Regulasi (RAG knowledge base)** — 3 dokumen resmi, di-chunk (1000 karakter, overlap 150) → 430 chunks di ChromaDB:
1. UU No. 7/2021 (UU HPP) — dasar hukum PPN & tarif
2. PMK No. 131/2024 — dasar kenaikan tarif PPN ke 12%
3. PMK No. 11/2025 — ketentuan DPP Nilai Lain masa transisi

**Dummy faktur untuk testing** — 8 faktur pajak sintetis dengan ground truth: 5 kasus normal (variasi nominal/tanggal/tarif) + 3 kasus uji negatif yang sengaja salah (tarif tidak berlaku, format NSFP salah, perhitungan PPN tidak konsisten)

*Catatan jujur: data sintetis, bukan hasil scan/foto faktur asli — lihat bagian keterbatasan.*

---

## Metrik & Hasil Evaluasi

**Extraction accuracy** (5 faktur normal, 7 field/faktur):

| Field | Akurasi |
|---|---|
| Semua 7 field | **100%** (35/35) |

**Compliance detection** (1 normal + 3 kasus negatif):

| Kasus | Hasil |
|---|---|
| Normal → `compliant` | ✅ |
| Tarif tidak berlaku → `flagged` | ✅ |
| Format NSFP salah → `flagged` | ✅ |
| Perhitungan PPN salah → `flagged` | ✅ |

**4/4 kasus terklasifikasi benar**, reasoning tarif terbukti grounded — mengutip pasal spesifik dari dokumen yang di-retrieve, bukan jawaban umum model.

---

## Metodologi

1. Desain arsitektur & data contract (Pydantic models) sebelum coding — `ExtractedField[T]` generik dengan `value` + `confidence`
2. Bangun RAG pipeline: download regulasi → chunk → embed → ChromaDB
3. Generate dummy faktur + ground truth (termasuk kasus uji negatif by design)
4. Implementasi Extraction Agent → verifikasi lewat eval script vs ground truth
5. Implementasi Compliance Agent (hybrid rule-based + RAG) → verifikasi lewat test kasus negatif
6. Orchestration layer + REST endpoint → frontend upload/result UI
7. Testing end-to-end (pytest + smoke test HTTP nyata) sebelum deploy

---

## Tantangan yang Dihadapi

1. **Menentukan mana yang layak LLM, mana cukup kode biasa** — godaan awal serahkan semua ke LLM; solusinya pisahkan berdasarkan apakah butuh interpretasi teks yang berubah (RAG+LLM) vs aturan tetap (kode)
2. **Struktur output reliabel dari LLM** — pindah dari "minta JSON di prompt lalu parse manual" ke `client.messages.parse()` dengan schema Pydantic, tervalidasi di sisi API
3. **shadcn/ui CLI flag yang sudah tidak valid** — `--base-color` gagal silently, ditemukan & diperbaiki
4. **File `.env.local.example` tidak ter-track git** — kena pola `.gitignore` bawaan `create-next-app` yang menyapu semua `.env*`
5. **Regulasi yang berhasil diunduh cuma 3 dari 5 rencana awal** — scope reduction yang disengaja demi deadline, dicatat jujur

---

## Yang Dipelajari

- Pemisahan tanggung jawab antar-agent langsung berdampak ke kemudahan debugging saat hasil salah
- Tidak semua masalah "AI" harus diselesaikan dengan LLM — kode deterministik lebih murah & konsisten untuk aturan pasti
- "Mengaku tidak tahu" (`inconclusive`) adalah fitur yang disengaja, bukan kekurangan — terutama di domain berdampak nyata seperti pajak

---

## Keterbatasan & Saran Pengembangan

**Keterbatasan saat ini:**
- Dataset evaluasi sintetis (gambar bersih), belum diuji ke foto/scan faktur asli yang lebih bervariasi kualitasnya
- Baru 3 dari 5 dokumen regulasi yang direncanakan
- Status `inconclusive` belum ada test case otomatis yang memicunya

**Rencana pengembangan (relevan untuk lanjutan skripsi):**
- Uji dengan foto faktur asli (bukan sintetis) untuk mengukur robustness nyata
- Tambah dokumen regulasi (PER-11/PJ/2025, dst.)
- Dokumen pajak lain (bukti potong PPh, SPT), autentikasi, riwayat upload per user

---

## Scope Boundaries

**In scope:** 1 jenis dokumen (Faktur Pajak), upload single file, 3 dokumen regulasi, extraction + compliance + laporan UI, deploy publik

**Out of scope (bootcamp ini):** jenis dokumen pajak lain, riwayat/histori upload, autentikasi/login, batch upload multi-dokumen, tracking deadline klien — ini next steps untuk skripsi

---

## Tautan

- **Kode sumber:** https://github.com/abdillah-me/pajak-cek
- **Demo:** https://pajak-cek.vercel.app
- **Hasil evaluasi lengkap:** `docs/superpowers/eval-results/`
- **README lengkap:** `README.md`

Terima kasih.
