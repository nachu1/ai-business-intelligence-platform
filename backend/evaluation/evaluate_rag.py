
import asyncio
import json
from pathlib import Path

from app.ai.company_context import get_rag_company_context
from app.ai.rag_chain import run_rag
from app.services.user_service import get_user_by_email

from evaluation.dataset_01 import evaluation_questions


EVALUATION_USER_EMAIL = "nasarc530@gmail.com"

OUTPUT_PATH = (
    Path(__file__).resolve().parent
    / "runs"
    / "evaluation_01.json"
)


async def evaluate_rag():
    user = await get_user_by_email(EVALUATION_USER_EMAIL)

    if not user:
        print("Evaluation user not found.")
        return

    company_context = get_rag_company_context(user)
    results = []

    for index, item in enumerate(evaluation_questions, start=1):
        question = item["question"]

        print(f"\nEvaluating question {index}/{len(evaluation_questions)}")
        print(f"Question: {question}")

        result = await run_rag(
            question=question,
            current_user=user,
            chat_history=[],
            company_context=company_context,
        )

        answer = result["answer"]

        # Normalize the document chain output into a string.
        if isinstance(answer, dict):
            answer = answer.get("answer", str(answer))

        contexts = [
            document.page_content
            for document in result["context"]
        ]

        results.append({
            "user_input": question,
            "retrieved_contexts": contexts,
            "response": str(answer),
            "reference": item["reference"],
        })

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_PATH.open("w", encoding="utf-8") as file:
        json.dump(results, file, ensure_ascii=False, indent=2)

    print(f"\nSaved {len(results)} evaluation records to:")
    print(OUTPUT_PATH)


if __name__ == "__main__":
    asyncio.run(evaluate_rag())
