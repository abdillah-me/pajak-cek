import chromadb
from app.config import settings

_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)
_collection = _client.get_or_create_collection("tax_regulations")


def query_regulations(query: str, n_results: int = 3) -> list[dict]:
    results = _collection.query(query_texts=[query], n_results=n_results)
    documents = results["documents"][0]
    metadatas = results["metadatas"][0]
    return [
        {"text": doc, "source": meta["source"], "regulation": meta["regulation"]}
        for doc, meta in zip(documents, metadatas)
    ]
