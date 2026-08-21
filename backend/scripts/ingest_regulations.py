from pathlib import Path
import chromadb
from pypdf import PdfReader

DATA_DIR = Path(__file__).parent.parent / "data" / "regulations"
CHROMA_DIR = Path(__file__).parent.parent / "data" / "chroma_db"
CHUNK_SIZE = 1000  # karakter per chunk
CHUNK_OVERLAP = 150


def extract_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def chunk_text(text: str, size: int, overlap: int) -> list[str]:
    chunks = []
    start = 0
    while start < len(text):
        chunks.append(text[start : start + size])
        start += size - overlap
    return [c.strip() for c in chunks if c.strip()]


def ingest():
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    collection = client.get_or_create_collection("tax_regulations")

    for pdf_path in DATA_DIR.glob("*.pdf"):
        text = extract_text(pdf_path)
        chunks = chunk_text(text, CHUNK_SIZE, CHUNK_OVERLAP)
        ids = [f"{pdf_path.stem}-{i}" for i in range(len(chunks))]
        metadatas = [{"source": pdf_path.name, "regulation": pdf_path.stem} for _ in chunks]
        collection.add(ids=ids, documents=chunks, metadatas=metadatas)
        print(f"Ingested {len(chunks)} chunks from {pdf_path.name}")


if __name__ == "__main__":
    ingest()
