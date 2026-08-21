"""Generate dummy faktur pajak (PNG) + ground truth JSON untuk testing extraction agent.
Data sepenuhnya fiktif -- NPWP, nama perusahaan, dan nominal tidak merujuk entitas nyata.
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
    {
        "file": "faktur-03-normal-12persen.png",
        "expected": {
            "npwp_penjual": "01.234.567.8-901.000",
            "npwp_pembeli": "07.890.123.4-567.000",
            "tanggal_faktur": "2025-07-20",
            "nomor_seri_faktur": "010.001-25.00000078",
            "dpp": 15_500_000,
            "tarif_ppn": 12,
            "ppn_terutang": 1_860_000,
        },
        "note": "Variasi nominal & tanggal, tarif 12% normal",
    },
    {
        "file": "faktur-04-normal-12persen.png",
        "expected": {
            "npwp_penjual": "01.234.567.8-901.000",
            "npwp_pembeli": "08.901.234.5-678.000",
            "tanggal_faktur": "2025-08-02",
            "nomor_seri_faktur": "010.001-25.00000091",
            "dpp": 7_250_000,
            "tarif_ppn": 12,
            "ppn_terutang": 870_000,
        },
        "note": "Variasi nominal & tanggal, tarif 12% normal",
    },
    {
        "file": "faktur-05-normal-12persen.png",
        "expected": {
            "npwp_penjual": "01.234.567.8-901.000",
            "npwp_pembeli": "09.012.345.6-789.000",
            "tanggal_faktur": "2025-08-10",
            "nomor_seri_faktur": "010.001-25.00000102",
            "dpp": 30_000_000,
            "tarif_ppn": 12,
            "ppn_terutang": 3_600_000,
        },
        "note": "Variasi nominal & tanggal, tarif 12% normal",
    },
    {
        "file": "faktur-06-salah-tarif.png",
        "expected": {
            "npwp_penjual": "01.234.567.8-901.000",
            "npwp_pembeli": "04.567.890.1-234.000",
            "tanggal_faktur": "2025-07-01",
            "nomor_seri_faktur": "010.001-25.00000099",
            "dpp": 10_000_000,
            "tarif_ppn": 10,  # SENGAJA SALAH -- sudah tidak berlaku sejak UU HPP 2021/2022
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
            "nomor_seri_faktur": "12345",  # SENGAJA SALAH -- bukan format 17 digit
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
            "ppn_terutang": 1_000_000,  # SENGAJA SALAH -- seharusnya 1.200.000 (12% x DPP)
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
