from pathlib import Path
from app.compliance_agent import check_compliance
from app.extraction_agent import extract_faktur_data

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


def test_wrong_nsfp_format_is_flagged():
    image_bytes = (DUMMY_DIR / "faktur-07-salah-nsfp.png").read_bytes()
    extraction = extract_faktur_data(image_bytes, media_type="image/png")
    report = check_compliance(extraction.data)
    assert report.status == "flagged"
    assert any("nomor_seri_faktur" in issue.field for issue in report.issues)


def test_inconsistent_ppn_calculation_is_flagged():
    image_bytes = (DUMMY_DIR / "faktur-08-salah-hitung.png").read_bytes()
    extraction = extract_faktur_data(image_bytes, media_type="image/png")
    report = check_compliance(extraction.data)
    assert report.status == "flagged"
    assert any("ppn_terutang" in issue.field for issue in report.issues)
