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
            try:
                resp = client.get(url)
                resp.raise_for_status()
                (DEST / filename).write_bytes(resp.content)
                print(f"Downloaded {filename} ({len(resp.content)} bytes)")
            except httpx.HTTPError as exc:
                print(f"FAILED {filename}: {exc} -- cari ulang link resmi terbaru di pajak.go.id")


if __name__ == "__main__":
    download_all()
