
import asyncio
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
RUN_PATH = BASE_DIR / "runs" / "evaluation_01.json"
METRICS_PATH = BASE_DIR / "metrics" / "evaluation_01.json"
OUTPUT_PATH = (
    BASE_DIR / "metrics" / "combined_context_evaluation_01.json"
)

MODEL_NAME = "openai/gpt-oss-120b"


class CombinedContextJudgment(BaseModel):
    supported: bool = Field(
        description=(
            "True when the combined retrieved contexts contain sufficient "
            "evidence to support the reference answer."
        )
    )
    reason: str = Field(
        description="Explain which evidence supports the answer or is missing."
    )


async def main():
    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("GROQ_API_KEY is missing.")

    with open(RUN_PATH, encoding="utf-8") as f:
        records = json.load(f)

    with open(METRICS_PATH, encoding="utf-8") as f:
        metrics = json.load(f)

    zero_precision = {
        item["user_input"]
        for item in metrics["individual_scores"]
        if item.get("context_precision") is not None
        and float(item["context_precision"]) == 0.0
    }

    selected = [
        record for record in records
        if record.get("user_input") in zero_precision
    ]

    if not selected:
        print("No zero-precision questions found.")
        return

    llm = ChatGroq(
        model=MODEL_NAME,
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
    ).with_structured_output(CombinedContextJudgment)

    results = []

    for i, record in enumerate(selected, start=1):
        contexts = record.get("retrieved_contexts") or []

        if contexts:
            combined_context = "\n\n".join(
                f"[Context {j}]\n{context}"
                for j, context in enumerate(contexts, start=1)
            )

            prompt = f"""
You are evaluating retrieval evidence for a RAG system.

Assess the COMBINED contexts, not each context independently.

Question:
{record["user_input"]}

Reference answer:
{record.get("reference", "")}

All retrieved contexts:
{combined_context}

Rules:
- Consider all contexts together.
- Different contexts may contain complementary evidence.
- Numerical calculations are supported when the necessary input values
  appear in the combined contexts and the calculation is valid.
- Do not require every context to contain the entire answer.
- Return supported=True only if the reference answer is adequately
  supported by the combined evidence.
- If essential evidence is missing or contradicted, return False.
- Ignore unrelated information when deciding whether sufficient
  supporting evidence exists.
"""
            judgment = await llm.ainvoke(prompt)
            supported = judgment.supported
            reason = judgment.reason
        else:
            supported = False
            reason = "No retrieved contexts were available."

        results.append({
            "user_input": record["user_input"],
            "combined_context_support": supported,
            "reason": reason,
            "context_count": len(contexts),
        })

        print(f"\n{i}/{len(selected)}: {record['user_input']}")
        print("Combined evidence supported:", supported)
        print("Reason:", reason)

    supported_count = sum(
        result["combined_context_support"] for result in results
    )
    total = len(results)

    report = {
        "evaluation_id": "combined_context_evaluation_01",
        "evaluator_model": MODEL_NAME,
        "evaluation_type": "combined_context_support_rate",
        "question_count": total,
        "supported_count": supported_count,
        "combined_context_support_rate": supported_count / total,
        "combined_context_support_percentage": (
            supported_count / total * 100
        ),
        "results": results,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 50)
    print("COMBINED-CONTEXT EVALUATION")
    print("=" * 50)
    print(f"Questions evaluated: {total}")
    print(f"Supported: {supported_count}/{total}")
    print(
        "Combined-context support rate: "
        f"{report['combined_context_support_percentage']:.2f}%"
    )
    print("Saved to:", OUTPUT_PATH)


if __name__ == "__main__":
    asyncio.run(main())


