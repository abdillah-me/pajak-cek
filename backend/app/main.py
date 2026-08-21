from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Pajak-Cek API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # dipersempit ke domain Vercel saat deploy (Task 14)
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
