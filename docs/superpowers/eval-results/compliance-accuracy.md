# Compliance Agent — Hasil Evaluasi Kasus Negatif

**Tanggal evaluasi:** 2026-08-21
**Model:** `claude-opus-5` (dipakai hanya untuk pengecekan validitas tarif via RAG; NSFP & konsistensi perhitungan PPN dicek deterministik di Python — lihat rationale di `backend/app/compliance_agent.py`)
**Test:** `backend/tests/test_compliance_agent.py` (`pytest tests/test_compliance_agent.py -v`) — semua PASS

## Ringkasan hasil

| Kasus | File | Status yang diharapkan | Status aktual | Terdeteksi? |
|---|---|---|---|---|
| Normal | `faktur-02-normal-12persen.png` | compliant | compliant | ✅ |
| Tarif salah (10%, sudah tidak berlaku) | `faktur-06-salah-tarif.png` | flagged | flagged | ✅ |
| Format NSFP salah (bukan 17 digit) | `faktur-07-salah-nsfp.png` | flagged | flagged | ✅ |
| Perhitungan PPN tidak konsisten | `faktur-08-salah-hitung.png` | flagged | flagged | ✅ |

**4/4 kasus terdeteksi dengan benar. Tidak ada false positive (kasus normal tetap "compliant") maupun false negative (semua kasus salah ter-flag).**

## Detail per kasus

### Kasus 1 — Normal (`faktur-02-normal-12persen.png`)
- Status: `compliant`
- Sources yang dirujuk untuk validasi: `sp4-pmk11-2025-dpp-nilai-lain.pdf`, `uu-hpp-2021.pdf`

### Kasus 2 — Tarif salah (`faktur-06-salah-tarif.png`)
- Ground truth: tarif 10% pada faktur bertanggal 2025-07-01 — tarif ini sudah tidak berlaku.
- Status: `flagged`, field `tarif_ppn`
- Reasoning model (dikutip langsung, grounded pada potongan regulasi yang di-retrieve):
  > "Menurut Pasal 7 ayat (1) UU HPP, tarif PPN adalah 11% mulai 1 April 2022 dan 12% mulai berlaku paling lambat 1 Januari 2025. Untuk faktur bertanggal 1 Juli 2025, tarif yang berlaku adalah 12% ... Tarif 10% tidak dikenal lagi sejak 1 April 2022 berdasarkan potongan regulasi yang diberikan, sehingga tarif 10% tidak valid untuk tanggal tersebut."
- Ini menunjukkan RAG grounding bekerja: alasan yang diberikan merujuk pasal spesifik dari dokumen yang di-retrieve, bukan jawaban umum dari pengetahuan model.

### Kasus 3 — Format NSFP salah (`faktur-07-salah-nsfp.png`)
- Ground truth: nomor seri faktur `"12345"` (seharusnya format `XXX.XXX-XX.XXXXXXXX`).
- Status: `flagged`, field `nomor_seri_faktur`
- Ini dicek **deterministik** (regex), bukan lewat LLM — dipilih karena validasi format adalah aturan mekanis yang tidak butuh reasoning, dan regex jauh lebih murah & 100% konsisten dibanding meminta LLM membaca format.

### Kasus 4 — Perhitungan PPN tidak konsisten (`faktur-08-salah-hitung.png`)
- Ground truth: DPP 10.000.000, tarif 12%, tapi PPN terutang tertulis 1.000.000 (seharusnya 1.200.000).
- Status: `flagged`, field `ppn_terutang`
- Message: "PPN terutang (1,000,000) tidak konsisten dengan DPP x tarif (10,000,000 x 12% = 1,200,000)"
- Sama seperti kasus 3, ini dicek **deterministik** (aritmatika `dpp * tarif / 100`), bukan LLM.

## Desain: kapan pakai LLM+RAG vs kapan pakai kode deterministik

Bukan semua compliance check di-serahkan ke LLM. Pembagiannya:
- **Deterministik (Python murni)**: format NSFP (regex), konsistensi perhitungan PPN (aritmatika). Ini aturan mekanis — pakai LLM di sini hanya menambah biaya & risiko halusinasi tanpa manfaat.
- **LLM + RAG**: validitas tarif PPN terhadap tanggal faktur. Ini butuh reasoning atas teks regulasi yang berubah dari waktu ke waktu (transisi 11%→12%) — kandidat yang tepat untuk RAG karena jawabannya tidak bisa di-hardcode tanpa mengikuti perubahan regulasi.

## Perilaku "inconclusive" (belum teruji lewat dummy case)

Sesuai desain di spec (`docs/superpowers/specs/2026-08-12-pajak-cek-design.md` §8), kalau RAG tidak menemukan dokumen relevan untuk validasi tarif, compliance agent mengembalikan status `inconclusive` alih-alih menjawab dari pengetahuan umum model (mencegah halusinasi tarif lama). Belum ada dummy faktur yang sengaja dirancang untuk memicu retrieval kosong, jadi path ini belum diverifikasi lewat automated test — hanya lewat code review terhadap `_check_tarif_validity` di `backend/app/compliance_agent.py`.

## Known gap

Dataset kasus negatif terbatas pada 3 jenis kesalahan (tarif, NSFP, perhitungan). Skenario lain yang belum diuji: NPWP dengan format tidak valid, tanggal faktur di luar rentang wajar, atau kombinasi banyak kesalahan sekaligus dalam satu faktur.
