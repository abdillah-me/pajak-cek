from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
DUMMY_DIR = Path(__file__).parent.parent / "data" / "dummy_faktur"


def test_analyze_faktur_normal_case():
    image_path = DUMMY_DIR / "faktur-02-normal-12persen.png"
    with open(image_path, "rb") as f:
        response = client.post(
            "/api/analyze-faktur",
            files={"file": ("faktur.png", f, "image/png")},
        )
    assert response.status_code == 200
    body = response.json()
    assert body["extraction"]["readable"] is True
    assert body["compliance"]["status"] == "compliant"


def test_analyze_faktur_rejects_unsupported_format():
    response = client.post(
        "/api/analyze-faktur",
        files={"file": ("faktur.txt", b"bukan gambar", "text/plain")},
    )
    assert response.status_code == 400
