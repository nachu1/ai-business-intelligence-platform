def reciprocal_rank_fusion(
    result_lists,
    k: int = 60,
    top_k: int = 10,
):
    scores = {}
    documents = {}

    for results in result_lists:
        seen_in_list = set()

        for rank, document in enumerate(results, start=1):
            key = (
                document.metadata.get("document_id"),
                document.metadata.get("chunk_number"),
            )

            if key in seen_in_list:
                continue

            seen_in_list.add(key)

            scores[key] = scores.get(key, 0) + (
                1 / (k + rank)
            )

            documents[key] = document

    ranked = sorted(
        documents,
        key=lambda key: scores[key],
        reverse=True,
    )

    return [
        documents[key]
        for key in ranked[:top_k]
    ]