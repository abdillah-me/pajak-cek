from app.rag import query_regulations


def test_query_returns_relevant_chunks():
    results = query_regulations("tarif PPN barang mewah 2025", n_results=3)
    assert len(results) > 0
    assert all("source" in r for r in results)
