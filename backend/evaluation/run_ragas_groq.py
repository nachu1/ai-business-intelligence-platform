
import asyncio
import json
import os
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from datasets import Dataset
from pydantic import BaseModel, Field
from langchain_groq import ChatGroq
from ragas import evaluate
from ragas.metrics import Faithfulness, ContextRecall

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
INPUT_PATH = BASE_DIR / "runs" / "evaluation_01.json"

# Preserve the existing baseline. Save the modified evaluation separately.
OUTPUT_PATH = (
    BASE_DIR / "metrics" / "evaluation_02_combined_precision.json"
)

MODEL_NAME = "openai/gpt-oss-120b"


class ContextVerdict(BaseModel):
    context_index: int = Field(
        description="One-based index of the context in the original retrieval order."
    )
    relevant: bool = Field(
        description=(
            "Whether this context contributes evidence needed to answer "
            "the question, considering ALL retrieved contexts together."
        )
    )
    reason: str = Field(
        description="Brief reason explaining the context's contribution."
    )


class CombinedPrecisionJudgment(BaseModel):
    verdicts: list[ContextVerdict]


def average_precision(verdicts: list[bool]) -> float:
    """Calculate average precision from relevance verdicts in retrieval order."""
    relevant_total = sum(verdicts)

    if relevant_total == 0:
        return 0.0

    relevant_so_far = 0
    precision_sum = 0.0

    for rank, relevant in enumerate(verdicts, start=1):
        if relevant:
            relevant_so_far += 1
            precision_sum += relevant_so_far / rank

    return precision_sum / relevant_total


async def combined_context_precision(
    judge,
    question: str,
    reference: str,
    contexts: list[str],
) -> tuple[float, list[dict]]:
    """
    Judge every context's contribution while seeing all contexts together.
    Calculate average precision using the original retrieval order.
    """
    if not contexts:
        return 0.0, []

    combined_context = "\n\n".join(
        f"[Context {index}]\n{context}"
        for index, context in enumerate(contexts, start=1)
    )

    prompt = f"""
You are evaluating retrieval quality for a RAG system.

Question:
{question}

Reference answer:
{reference}

ALL retrieved contexts, in their original retrieval order:
{combined_context}

Evaluate the contribution of EACH context while considering ALL contexts
together.

Rules:
1. Do not judge a context in isolation.
2. Different contexts may contain complementary evidence.
3. A context is relevant if it contributes evidence needed to answer the
   question, even if another context contains a different required value.
4. For a comparison or calculation, for example, one context may provide
   the first month's value and another context may provide the second.
   Both can be relevant when considered together.
5. Do not mark a context relevant merely because it discusses the same topic.
   It must contribute useful evidence for the reference answer.
6. Preserve the original context indices and return exactly one verdict
   for every context.
7. Return relevance judgments, not a rewritten answer.
"""

    judgment = await judge.ainvoke(prompt)

    verdict_by_index = {
        item.context_index: item
        for item in judgment.verdicts
    }

    expected_indices = set(range(1, len(contexts) + 1))

    if (
        len(judgment.verdicts) != len(contexts)
        or set(verdict_by_index) != expected_indices
    ):
        raise ValueError(
            "The judge did not return exactly one verdict per context."
        )

    ordered_verdicts = [
        verdict_by_index[index]
        for index in range(1, len(contexts) + 1)
    ]

    score = average_precision(
        [item.relevant for item in ordered_verdicts]
    )

    details = [
        {
            "context_index": item.context_index,
            "relevant": item.relevant,
            "reason": item.reason,
        }
        for item in ordered_verdicts
    ]

    return score, details


async def main():
    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("GROQ_API_KEY is missing from your .env file.")

    if not INPUT_PATH.exists():
        raise FileNotFoundError(f"Evaluation run not found: {INPUT_PATH}")

    with open(INPUT_PATH, "r", encoding="utf-8") as file:
        records = json.load(file)

    if not records:
        raise ValueError("The evaluation dataset is empty.")

    dataset = Dataset.from_list(records)

    evaluator_llm = ChatGroq(
        model=MODEL_NAME,
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
    )

    # Keep the two standard RAGAS metrics unchanged.
    print("Running RAGAS Faithfulness and Context Recall...")

    ragas_result = evaluate(
        dataset=dataset,
        metrics=[
            Faithfulness(llm=evaluator_llm),
            ContextRecall(llm=evaluator_llm),
        ],
        llm=evaluator_llm,
        batch_size=1,
        raise_exceptions=False,
    )

    scores_df = ragas_result.to_pandas()

    if len(scores_df) != len(records):
        raise RuntimeError(
            "The number of evaluation results does not match the input dataset."
        )

    # Custom combined-aware Context Precision.
    judge = evaluator_llm.with_structured_output(
        CombinedPrecisionJudgment
    )

    precision_scores = []
    precision_details = []

    for index, record in enumerate(records, start=1):
        print(
            f"\nCombined-context precision: "
            f"{index}/{len(records)} — {record['user_input']}"
        )

        score, details = await combined_context_precision(
            judge=judge,
            question=record["user_input"],
            reference=record["reference"],
            contexts=record.get("retrieved_contexts") or [],
        )

        precision_scores.append(score)
        precision_details.append(details)

        print(f"Combined-aware precision: {score:.4f}")

    # Build a separate report without overwriting the original baseline.
    individual_scores = []

    for index, record in enumerate(records):
        row = scores_df.iloc[index].to_dict()

        individual_scores.append({
            **record,
            "faithfulness": (
                None
                if pd.isna(row.get("faithfulness"))
                else float(row["faithfulness"])
            ),
            "combined_context_precision": precision_scores[index],
            "combined_precision_judgments": precision_details[index],
            "context_recall": (
                None
                if pd.isna(row.get("context_recall"))
                else float(row["context_recall"])
            ),
        })

    def mean_valid(key):
        values = [
            item[key]
            for item in individual_scores
            if item[key] is not None
        ]
        return sum(values) / len(values) if values else None

    report = {
        "evaluation_id": "evaluation_02_combined_precision",
        "evaluator_model": MODEL_NAME,
        "question_count": len(individual_scores),
        "precision_method": (
            "Custom combined-aware relevance judgments followed by "
            "average precision in original retrieval order."
        ),
        "average_scores": {
            "faithfulness": mean_valid("faithfulness"),
            "combined_context_precision": mean_valid(
                "combined_context_precision"
            ),
            "context_recall": mean_valid("context_recall"),
        },
        "individual_scores": individual_scores,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    with open(OUTPUT_PATH, "w", encoding="utf-8") as file:
        json.dump(report, file, indent=2, ensure_ascii=False)

    print("\n" + "=" * 60)
    print("RAG EVALUATION RESULTS — GROQ")
    print("=" * 60)
    print("Questions evaluated:", len(individual_scores))

    for name, score in report["average_scores"].items():
        if score is None:
            print(f"{name}: unavailable")
        else:
            print(f"{name}: {score:.4f}")

    print("\nSaved metrics to:", OUTPUT_PATH)


if __name__ == "__main__":
    asyncio.run(main())

