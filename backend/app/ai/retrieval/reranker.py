from langsmith import traceable
from sentence_transformers import CrossEncoder


model = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2"
)


@traceable(name="Cross-Encoder Reranker")
def rerank(
    query: str,
    documents,
    k: int = 5,
):
    if not documents:
        return []

    pairs = [
        (query, document.page_content)
        for document in documents
    ]

    scores = model.predict(pairs)

    ranked = sorted(
        zip(documents, scores),
        key=lambda item: item[1],
        reverse=True,
    )

    print("\n===== RERANKER RESULTS =====")
    print("Query:", query)

    results = []

    for index, (document, score) in enumerate(
        ranked[:k],
        start=1,
    ):
        score = float(score)

        # Preserve the existing Document object while
        # exposing the reranker score for downstream analysis.
        document.metadata["rerank_score"] = score

        print(f"\nRank {index}")
        print("Score:", score)
        print("Content:", document.page_content[:300])

        results.append(document)

    print("============================\n")

    return results