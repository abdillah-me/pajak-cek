# Extraction Agent — Hasil Evaluasi Akurasi

**Tanggal evaluasi:** 2026-08-21
**Model:** `claude-opus-5` (vision, via `client.messages.parse`)
**Script:** `backend/scripts/eval_extraction.py`
**Dataset:** 5 dummy faktur "normal" (bukan kasus uji negatif) dari `backend/data/dummy_faktur/ground_truth.json`

## Hasil

| Field | Correct | Total | Accuracy |
|---|---|---|---|
| npwp_penjual | 5 | 5 | 100.0% |
| npwp_pembeli | 5 | 5 | 100.0% |
| tanggal_faktur | 5 | 5 | 100.0% |
| nomor_seri_faktur | 5 | 5 | 100.0% |
| dpp | 5 | 5 | 100.0% |
| tarif_ppn | 5 | 5 | 100.0% |
| ppn_terutang | 5 | 5 | 100.0% |

**Overall: 35/35 field (100.0%)**

Tidak ada mismatch. Confidence yang dikembalikan model untuk `tarif_ppn` konsisten `high`/`medium` di semua kasus (diverifikasi lewat `test_extract_normal_faktur`), sesuai ekspektasi karena field ini krusial untuk compliance check di tahap berikutnya.

## Catatan jujur soal keterbatasan evaluasi ini

- **Dataset kecil (5 kasus)** dan berupa gambar PNG yang di-generate secara sintetis (bukan hasil scan/foto faktur asli) — teksnya bersih, tidak ada noise/blur/kemiringan seperti dokumen dunia nyata. Akurasi 100% di sini **tidak** menjamin performa sama pada foto faktur asli (hasil scan/foto HP) yang jauh lebih bervariasi kualitasnya.
- Variasi yang diuji terbatas pada: nominal DPP berbeda, tanggal berbeda (termasuk masa transisi tarif 11%→12%), dan NPWP berbeda. Belum diuji: faktur dengan tata letak berbeda, watermark, atau faktur yang benar-benar buram/miring.
- Belum ada uji langsung terhadap kasus "gambar bukan faktur pajak sama sekali" — path `readable=false` divalidasi lewat desain prompt, bukan lewat kasus uji dummy khusus.

## Yang belum diperbaiki (known gap)

Karena keterbatasan waktu (deadline bootcamp), dataset evaluasi tidak diperluas ke faktur hasil scan/foto asli yang lebih representatif. Ini kandidat perbaikan realistis untuk iterasi berikutnya (relevan juga untuk pengembangan lanjutan ke arah skripsi).
