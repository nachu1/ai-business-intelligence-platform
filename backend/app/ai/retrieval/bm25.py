from rank_bm25 import BM25Okapi


def tokenize(text: str):
    return text.lower().split()


def build_bm25(documents):
    corpus = [
        tokenize(doc.page_content)
        for doc in documents
    ]

    return BM25Okapi(corpus)


def search_bm25(
    query: str,
    documents,
    k: int = 5,
):
    if not documents:
        return []

    bm25 = build_bm25(documents)

    scores = bm25.get_scores(
        tokenize(query)
    )

    ranked = sorted(
        zip(documents, scores),
        key=lambda item: item[1],
        reverse=True,
    )

    return [
        document
        for document, _ in ranked[:k]
    ]