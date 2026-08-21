# Pajak-Cek — Smart Tax Document Compliance Agent

**Status:** Disetujui, siap masuk fase perencanaan implementasi
**Tanggal:** 2026-08-12
**Deadline final project:** 2026-08-21

## 1. Latar Belakang & Konteks

Ini adalah final project untuk AI Engineer Bootcamp (Ruang Guru), dengan syarat bebas topik selama mengintegrasikan konsep-konsep yang sudah dipelajari sepanjang bootcamp (khususnya modul terakhir: Prompt Engineering & RAG, NLP/Transformer, Agentic AI & LLM Applications).

Pemilik proyek punya latar belakang unik yang membentuk arah proyek ini:
- Software engineer (frontend) di perbankan, sedang belajar Java Spring Boot
- Kuliah Sistem Informasi di Binus, sedang skripsi dengan judul: **"Pengembangan Sistem Informasi Manajemen Operasional Konsultan Pajak Berbasis Web dengan Fitur Otomasi Kecerdasan Buatan"**
- Background D3 Akuntansi, pernah bekerja di konsultan pajak
- Sudah pernah menyelesaikan proyek CV end-to-end (bean leaf disease classifier, ResNet18 transfer learning, dipublikasikan ke Hugging Face Hub) — terbiasa dengan alur dataset → model → inferensi → publikasi, serta disiplin soal reproducibility dan keamanan credential

Karena topik skripsi secara eksplisit membutuhkan "fitur otomasi kecerdasan buatan" di sistem manajemen operasional konsultan pajak, final project bootcamp ini dirancang untuk menjadi **prototipe fitur AI** tersebut — satu proyek, dua kebutuhan (deadline bootcamp + fondasi skripsi).

## 2. Masalah yang Diselesaikan

Dari pengalaman kerja di konsultan pajak, staff (khususnya junior) sering menghadapi pekerjaan repetitif dan rawan human error terkait dokumen pajak: ekstraksi data manual dari faktur pajak, memastikan kesesuaian tarif/field dengan regulasi yang sering berubah (contoh nyata: transisi tarif PPN 11% → 12% di 2025), dan tracking deadline klien.

Dari beberapa opsi yang teridentifikasi (ekstraksi dokumen, tanya-jawab regulasi, tracking deadline), proyek ini fokus menggabungkan **ekstraksi data dari dokumen pajak** dan **tanya-jawab/cek kesesuaian regulasi** menjadi satu alur kerja yang koheren, karena kombinasi ini paling jarang dijumpai sebagai proyek bootcamp (dibanding RAG chatbot generik) sekaligus paling realistis diselesaikan dalam 9 hari oleh pemula dengan bantuan AI.

## 3. Overview Solusi

**Pajak-Cek** (nama sementara) adalah web app di mana user meng-upload gambar/PDF **Faktur Pajak**. Sistem:
1. Mengekstrak data terstruktur dari dokumen tersebut menggunakan LLM vision
2. Mengecek kesesuaian data hasil ekstraksi terhadap regulasi PPN terkini menggunakan RAG (Retrieval-Augmented Generation) atas dokumen peraturan resmi
3. Menampilkan hasil ekstraksi beserta status kepatuhan (✅ Sesuai / ⚠️ Perlu Ditinjau) dan kutipan pasal/regulasi yang menjadi dasar penilaian

**Value proposition:** membantu staff junior konsultan pajak memvalidasi faktur pajak klien dengan cepat tanpa harus hafal semua PMK/PER terbaru, mengurangi risiko salah tarif atau field yang tidak sesuai ketentuan.

## 4. Arsitektur

```
┌─────────────────┐      ┌──────────────────────────────────────────┐
│  Frontend        │      │  Backend (FastAPI)                        │
│  (Next.js/React) │◄────►│                                            │
│                  │ REST │  ┌─────────────┐   ┌───────────────────┐ │
│  - Upload page   │      │  │ 1. Extraction│   │ 2. Compliance      │ │
│  - Result view   │      │  │    Agent     │──►│    Agent (RAG)     │ │
│  - Loading/error │      │  │ (Vision LLM) │   │ (Vector DB search) │ │
│    states        │      │  └─────────────┘   └───────────────────┘ │
└──────────────────┘      │         │                    │            │
                           │         ▼                    ▼            │
                           │   ┌──────────────────────────────────┐   │
                           │   │ 3. Orchestrator (kontrol Python    │   │
                           │   │    linear, bukan framework agent  │   │
                           │   │    kompleks) → gabungkan hasil    │   │
                           │   │    jadi laporan                   │   │
                           │   └──────────────────────────────────┘   │
                           └──────────────────────────────────────────┘
                                          │
                                          ▼
                              ┌───────────────────────┐
                              │ Vector Store (Chroma)  │
                              │ 5 dokumen regulasi PPN │
                              │ (chunked + embedded)   │
                              └───────────────────────┘
```

### Kenapa 2 agent terpisah, bukan 1 prompt besar?

Separation of concerns: kalau digabung jadi satu prompt raksasa, LLM harus sekaligus "melihat gambar" DAN "mengingat semua aturan pajak" DAN "menyimpulkan kepatuhan" — ini menurunkan reliabilitas dan menyulitkan debugging (apakah ekstraksinya yang salah, atau pemahaman aturannya?). Dengan dipecah, tiap tahap bisa divalidasi independen, dan sistem jadi lebih auditable.

### Kenapa orchestration Python manual, bukan LangGraph/CrewAI dari awal?

Alur kerja (extract → compliance check → gabung) bersifat **linear**, bukan butuh agent yang mengambil keputusan dinamis soal tools mana yang dipanggil. YAGNI — framework agent baru dibutuhkan kalau ada percabangan logic nyata. Kontrol manual lebih mudah di-debug dan lebih jujur soal apa yang sebenarnya terjadi. Bisa dibungkus jadi LangGraph 2-node belakangan jika dibutuhkan untuk menunjukkan penggunaan framework agentic secara eksplisit.

## 5. Komponen & Tech Stack

| Komponen | Teknologi | Alasan |
|---|---|---|
| Frontend | Next.js + React + Tailwind (shadcn/ui) | Sesuai skill frontend pemilik proyek; shadcn mempercepat UI tanpa desain dari nol |
| Backend API | Python FastAPI | Standar untuk AI backend, integrasi mudah dengan LLM SDK |
| Extraction (vision) | Claude (Sonnet) via Anthropic API | Multimodal — bisa membaca gambar faktur langsung; satu SDK untuk extraction & compliance reasoning |
| RAG / Vector Store | ChromaDB (lokal) + embedding model | Ringan, tanpa infra tambahan, cukup untuk 5 dokumen regulasi |
| Orchestration | Python control flow biasa (bukan framework agent kompleks di awal) | Alur linear 2 tahap — YAGNI |
| Dummy data | 5-10 contoh faktur pajak dummy (fiktif, format realistis) | Belum ada data asli/legal untuk dipakai |
| Deployment | Frontend → Vercel · Backend → Railway/Render (free tier) | Bisa didemokan via link publik, penting untuk portfolio & skripsi |

## 6. Data Sumber Regulasi (RAG Knowledge Base)

Lima dokumen resmi berikut menjadi basis regulasi awal (scope sengaja dibatasi ke PPN/Faktur Pajak agar retrieval presisi):

1. **UU No. 7 Tahun 2021 (UU HPP)** — dasar hukum utama PPN & tarif — [pajak.go.id](https://www.pajak.go.id/sites/default/files/2021-12/Salinan%20UU%20Nomor%207%20Tahun%202021.pdf)
2. **PMK No. 131 Tahun 2024** — dasar kenaikan tarif PPN jadi 12% — via [Petunjuk Teknis Faktur Pajak DJP](https://www.pajak.go.id/sites/default/files/lampiran/Petunjuk%20Teknis%20Pembuatan%20Faktur%20Pajak%20dan%20Dokumen%20Tertentu%20yang%20Kedudukannya%20Dipersamakan%20dengan%20Faktur%20Pajak%20serta%20Penerapan%20PMK%20131%20Tahun%202024.pdf)
3. **PMK No. 11 Tahun 2025** — ketentuan DPP Nilai Lain untuk masa transisi tarif — [rilis resmi DJP](https://pajak.go.id/sites/default/files/2025-02/SP-4%20PEMERINTAH%20TERBITKAN%20ATURAN%20DPP%20NILAI%20LAIN%20DAN%20BESARAN%20TERTENTU%20PPN.pdf)
4. **PER-11/PJ/2025** — aturan format & proses e-Faktur terbaru (Coretax/SIAP)
5. **Petunjuk Teknis Pembuatan Faktur Pajak (DJP)** — panduan teknis pengisian field faktur pajak — paling relevan untuk cek kelengkapan/kesesuaian field

Dokumen-dokumen ini akan diunduh, di-chunk, dan di-embed ke ChromaDB pada fase implementasi.

## 7. Data Flow

```
POST /api/analyze-faktur
  → multipart upload (image/pdf)
  → validasi: format file, ukuran max, bisa dibaca
  → Extraction Agent → JSON terstruktur
    (NPWP penjual/pembeli, tanggal, DPP, tarif PPN, PPN terutang, no. seri faktur)
  → validasi: field wajib ada? jika LLM gagal ekstrak field kritis → flag "tidak terbaca",
    jangan lanjut ke compliance check dengan data kosong
  → Compliance Agent (RAG query menggunakan data hasil ekstraksi sebagai konteks)
  → Response: { extracted_data, compliance_status, issues[], sources[] }
```

## 8. Error Handling

Prinsip utama: **fail loud, jangan mengarang**. Di domain pajak, halusinasi LLM bukan sekadar bug teknis — itu risiko kredibilitas proyek. Sistem yang mengaku tidak tahu lebih baik daripada sistem yang percaya diri tapi salah.

- **Ekstraksi gagal/ambigu** (gambar buram, bukan faktur pajak) → jangan biarkan LLM mengarang data; balikin `confidence: low` atau `null` per field, tampilkan warning eksplisit ke user
- **RAG tidak menemukan dokumen relevan** → jangan biarkan LLM menjawab dari pengetahuan umum (risiko halusinasi tarif lama); harus eksplisit menyatakan "tidak ditemukan referensi regulasi yang cocok"
- **Rate limit / API LLM down** → tampilkan pesan error jelas di frontend, bukan spinner tanpa akhir

## 9. Testing / Evaluasi

Karena ini sistem berbasis LLM, evaluasi berbeda dari unit test kode deterministik biasa:

- **Extraction accuracy**: 5-10 dummy faktur dengan ground truth (nilai field yang sudah ditentukan saat generate dummy) → bandingkan hasil ekstraksi LLM vs ground truth, hitung akurasi per field
- **Compliance check correctness**: kasus uji yang sengaja dibuat salah (tarif salah, NSFP kurang digit) untuk memastikan compliance agent benar-benar menangkapnya — bukan hanya bisa validasi kasus yang benar
- **RAG retrieval check**: spot-check manual — pastikan dokumen yang ter-retrieve untuk suatu pertanyaan memang relevan (mis. pertanyaan soal tarif barang mewah 2025 harus me-retrieve PMK 131/2024)
- Bukan unit test klasik untuk logic LLM — cukup skenario/dataset uji kecil yang didokumentasikan alasannya

## 10. Scope Boundaries

**In scope:**
- 1 jenis dokumen (Faktur Pajak), upload single file
- 5 dokumen regulasi sebagai basis RAG
- Extraction + Compliance check + laporan hasil di UI
- Deploy publik (Vercel + Railway/Render)

**Out of scope (stretch goals / next steps untuk skripsi, bukan bagian final project bootcamp ini):**
- Jenis dokumen lain (bukti potong PPh, SPT)
- Riwayat/histori upload per user, autentikasi/login
- Multi-dokumen batch upload
- Fitur tracking deadline klien (opsi C dari brainstorming awal)

## 11. Timeline (9 hari, deadline 2026-08-21)

| Hari | Fokus |
|---|---|
| 1-2 | Setup project, generate dummy faktur pajak, kumpulkan & chunk 5 dokumen regulasi ke vector store |
| 3-4 | Extraction Agent + testing akurasi |
| 5-6 | Compliance Agent (RAG) + testing kasus salah |
| 7 | Integrasi backend (FastAPI endpoint) + orchestration |
| 8 | Frontend (upload page + result view) |
| 9 | Deploy + testing end-to-end + tulis dokumentasi/README |

## 12. Dokumentasi

Sesuai preferensi pemilik proyek, seluruh dokumentasi proses (spec, plan, catatan keputusan) disimpan dalam format Markdown (`.md`), konsisten dengan gaya dokumentasi di proyek CV sebelumnya (bean leaf disease classifier).
