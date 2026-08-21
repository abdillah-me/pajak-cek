from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.orchestrator import analyze_faktur

app = FastAPI(title="Pajak-Cek API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://pajak-cek.vercel.app", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {"image/png", "image/jpeg"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10MB


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/analyze-faktur")
async def analyze_faktur_endpoint(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Format {file.content_type} tidak didukung. Gunakan PNG/JPEG.")

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="Ukuran file melebihi 10MB.")

    try:
        extraction, compliance = analyze_faktur(contents, file.content_type)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gagal memproses dokumen: {exc}") from exc

    return {"extraction": extraction, "compliance": compliance}
