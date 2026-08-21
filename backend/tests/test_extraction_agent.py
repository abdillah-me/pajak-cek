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
