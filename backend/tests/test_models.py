from app.models import ExtractedField, ExtractedFakturData, ExtractionResult


def test_extraction_result_with_null_field():
    data = ExtractedFakturData(
        npwp_penjual=ExtractedField(value="01.234.567.8-901.000", confidence="high"),
        npwp_pembeli=ExtractedField(value=None, confidence="low"),
        tanggal_faktur=ExtractedField(value="2025-03-15", confidence="high"),
        nomor_seri_faktur=ExtractedField(value="010.001-25.00000001", confidence="high"),
        dpp=ExtractedField(value=10_000_000, confidence="high"),
        tarif_ppn=ExtractedField(value=11, confidence="high"),
        ppn_terutang=ExtractedField(value=1_100_000, confidence="high"),
    )
    result = ExtractionResult(readable=True, warning="npwp_pembeli tidak terbaca jelas", data=data)
    assert result.data.npwp_pembeli.value is None
    assert result.data.npwp_pembeli.confidence == "low"
