
import os
import asyncio
import json
from pathlib import Path

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from ragas.llms import LangchainLLMWrapper
from ragas.metrics._context_recall import (
    ContextRecall,
    QCA,
)

# Load environment variables from the backend .env file
BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

INPUT_PATH = (
    Path(__file__).resolve().parent
    / "metrics"
    / "evaluation_02_combined_precision.json"
)

TARGET_QUESTIONS = {
    "How did net profit change from March through June 2026?",
    "What was the total revenue from March through June 2026?",
}


async def main():
    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError(
            "GROQ_API_KEY is missing. Check the backend .env file."
        )

    if not INPUT_PATH.exists():
        raise FileNotFoundError(
            f"Evaluation report not found: {INPUT_PATH}"
        )

    with open(INPUT_PATH, "r", encoding="utf-8") as file:
        report = json.load(file)

    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY"),
    )

    metric = ContextRecall(
        llm=LangchainLLMWrapper(llm)
    )

    found_questions = set()

    try:
        for record in report.get("individual_scores", []):
            question = record.get("user_input")

            if question not in TARGET_QUESTIONS:
                continue

            found_questions.add(question)

            print("\n" + "=" * 70)
            print("QUESTION:", question)
            print("=" * 70)

            data = QCA(
                question=question,
                context="\n".join(
                    record.get("retrieved_contexts", [])
                ),
                answer=record.get("reference", ""),
            )

            try:
                result = await metric.context_recall_prompt.generate(
                    data=data,
                    llm=metric.llm,
                )

                total = len(result.classifications)
                supported = sum(
                    item.attributed == 1
                    for item in result.classifications
                )

                print(f"\nSupported statements: {supported}/{total}")
                print(
                    "Diagnostic Context Recall:",
                    supported / total if total else "N/A",
                )

                for index, item in enumerate(
                    result.classifications, start=1
                ):
                    print(f"\nStatement {index}: {item.statement}")
                    print(f"Supported: {item.attributed}")
                    print(f"Reason: {item.reason}")

            except Exception as exc:
                print(
                    f"\nDiagnostic failed: "
                    f"{type(exc).__name__}: {exc}"
                )

    finally:
        await llm.aclose()

    missing = TARGET_QUESTIONS - found_questions

    if missing:
        print("\nQuestions not found in the report:")
        for question in sorted(missing):
            print("-", question)


if __name__ == "__main__":
    asyncio.run(main())
