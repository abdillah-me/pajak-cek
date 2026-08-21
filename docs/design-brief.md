# Design Brief — Redesign Frontend Pajak-Cek

Dokumen ini berisi konteks & data nyata dari aplikasi yang sudah jalan, untuk dipakai sebagai bahan redesign (mis. di Claude Design / Figma / tool lain).

## 1. Apa aplikasinya

**Pajak-Cek** — web app single-page yang membaca gambar Faktur Pajak Indonesia, mengekstrak datanya secara otomatis (lewat LLM vision), lalu mengecek kesesuaiannya terhadap regulasi PPN yang berlaku.

**Target user**: staff junior di konsultan pajak yang input & validasi faktur klien secara manual setiap hari — butuh alat yang cepat dipakai tanpa training, dan yang **transparan** soal seberapa yakin sistem terhadap hasilnya (karena ini domain yang salah sedikit berdampak nyata).

**Tagline saat ini**: "Upload faktur pajak untuk ekstraksi data otomatis dan pemeriksaan kepatuhan terhadap regulasi PPN terbaru."

## 2. Alur pengguna (user flow) — saat ini cuma 1 halaman

```
[idle] → user pilih/drag gambar faktur (PNG/JPEG, maks 10MB)
       → klik "Analisis Faktur"
[loading] → tombol berubah jadi "Menganalisis..." (tidak ada progress detail — LLM vision + RAG butuh beberapa detik)
[selesai, 2 kemungkinan hasil]:
   a) sukses → tampil 2 kartu: "Data Faktur Terekstrak" + "Hasil Pemeriksaan Kepatuhan"
   b) gagal (gambar tidak terbaca sebagai faktur) → alert merah "Gambar tidak dapat dibaca"
[error lain] → alert merah (format salah, ukuran kelebihan, error server)
```

Tidak ada multi-step wizard, tidak ada riwayat/histori, tidak ada login — upload sekali, lihat hasil sekali, selesai.

## 3. Data yang ditampilkan (field-level, ini nyata dari backend)

### Kartu "Data Faktur Terekstrak" — 7 field, tiap field punya `confidence`:

| Label UI | Tipe | Format tampilan |
|---|---|---|
| NPWP Penjual | string | apa adanya |
| NPWP Pembeli | string | apa adanya |
| Tanggal Faktur | string (YYYY-MM-DD) | apa adanya |
| Nomor Seri Faktur | string | apa adanya (format resmi: `XXX.XXX-XX.XXXXXXXX`) |
| DPP | number | `Rp 20.000.000` (format Rupiah, `id-ID` locale) |
| Tarif PPN | number | `12%` |
| PPN Terutang | number | `Rp 2.400.000` |

Tiap field punya badge **confidence**: `high` / `medium` / `low`. Kalau model tidak yakin, `value` bisa `null` → tampil sebagai `—`.

**Penting untuk desain**: confidence badge ini bukan hiasan — ini sinyal kepercayaan yang harus mudah di-scan sekilas (mis. warna hijau/kuning/merah), karena user diinstruksikan untuk cek manual field ber-confidence rendah. Ide: mungkin field low-confidence butuh visual treatment lebih mencolok daripada sekadar badge kecil di kanan.

### Kartu "Hasil Pemeriksaan Kepatuhan" — status + daftar isu:

Status ada 3 kemungkinan (badge di judul kartu):
- `compliant` (hijau/default) — tidak ada masalah
- `flagged` (merah/destructive) — ada isu, ditampilkan sebagai daftar alert per-field, tiap alert punya `field`, `message`, dan `Sumber: <nama file regulasi>`
- `inconclusive` (abu-abu/secondary) — sistem tidak yakin, ada disclaimer khusus: *"Sistem tidak menemukan referensi regulasi yang cukup untuk memastikan kepatuhan tarif — bukan berarti sudah pasti benar."*

Di bawah kartu ini juga ada baris kecil: "Regulasi yang dirujuk: <daftar nama file PDF>" — ini penting untuk trust (menunjukkan jawabannya grounded ke dokumen asli, bukan karangan model).

### Case gagal total (readable = false)

Kalau gambar bukan faktur pajak sama sekali / tidak terbaca, hanya tampil satu alert: **"Gambar tidak dapat dibaca"** + pesan warning dari model.

## 4. Kondisi/state yang perlu didesain

1. Idle — dropzone kosong
2. Ada file dipilih — preview thumbnail gambar yang diupload
3. Loading — proses analisis (butuh beberapa detik, gabungan vision + RAG)
4. Sukses lengkap — kedua kartu tampil
5. Sukses sebagian — kartu ekstraksi + catatan warning (`extraction.warning` bisa terisi meski `readable: true`, mis. kualitas gambar kurang baik)
6. Gagal baca gambar — cuma 1 alert
7. Error (format salah / ukuran kelebihan / server error) — alert merah generik

## 5. Batasan teknis (redesign harus tetap kompatibel)

- **Stack**: Next.js 16 (App Router) + Tailwind CSS + shadcn/ui (Card, Badge, Alert, Button) — kalau desain baru mau dipakai lagi di kode ini, sebaiknya masih berbasis komponen shadcn/ui yang sama supaya tidak perlu instalasi ulang dependency
- Single page, tidak ada routing lain
- Tidak ada backend baru — kontrak data (field, status, struktur JSON) di atas ini **tidak bisa diubah**, karena berasal dari response API yang sudah fixed
- Bahasa UI: Indonesia

## 6. Arah desain — beberapa ide awal (bukan keputusan final, silakan dieksplorasi)

- **Visual identity**: konteks "konsultan pajak" — kesan tepercaya & profesional (mirip aplikasi fintech/accounting), bukan playful. Warna netral + 1 warna aksen untuk status.
- **Verifikasi berdampingan**: karena user perlu "cek manual" field low-confidence, mungkin worth explore layout split — gambar faktur asli di satu sisi, data terekstrak di sisi lain, biar user bisa bandingkan langsung tanpa scroll bolak-balik.
- **Confidence sebagai warna, bukan cuma teks badge**: highlight field low-confidence lebih jelas (misal border kiri merah tipis atau background pucat) supaya "yang perlu dicek" langsung kelihatan tanpa baca satu-satu.
- **Compliance status sebagai hero element**: status `compliant`/`flagged`/`inconclusive` ini kesimpulan paling penting dari seluruh proses — mungkin pantas jadi elemen paling menonjol di halaman hasil, bukan cuma badge kecil di judul card.
- **Progressive disclosure untuk sumber regulasi**: nama file PDF regulasi bisa kurang bermakna buat user awam — mungkin butuh tooltip/expandable buat jelasin "kenapa ini jadi sumber".
- **Empty/loading state yang menjelaskan proses**: karena ada 2 tahap (ekstraksi lalu compliance check) yang totalnya beberapa detik, loading state statis ("Menganalisis...") bisa terasa lama tanpa progress indication — ide: step indicator 2 tahap.

## 7. Referensi konten asli (copy yang sudah ada, buat dijaga konsistensi tone)

- Judul: "Pajak-Cek"
- Dropzone: "Klik atau seret gambar faktur pajak ke sini (PNG/JPEG, maks 10MB)"
- Tombol: "Analisis Faktur" → "Menganalisis..." (loading)
- Card 1: "Data Faktur Terekstrak" / "Nilai dengan confidence rendah berarti model tidak yakin — periksa manual."
- Card 2: "Hasil Pemeriksaan Kepatuhan"
- Error umum: "Format file harus PNG atau JPEG." / "Ukuran file maksimal 10MB."
