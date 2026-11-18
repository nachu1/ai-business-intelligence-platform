import json
import os

from dotenv import load_dotenv
from datasets import Dataset

from ragas import evaluate
from ragas.metrics import ContextPrecision

from langchain_groq import ChatGroq


load_dotenv(override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")


def main():
    with open(
        "evaluation/results.json",
        "r",
        encoding="utf-8",
    ) as file:
        results = json.load(file)

    dataset = Dataset.from_list(results)

    evaluator_llm = ChatGroq(
        model="openai/gpt-oss-120b",
        api_key=GROQ_API_KEY,
        temperature=0,
    )

    metrics = [
        ContextPrecision(
            llm=evaluator_llm
        ),
    ]

    result = evaluate(
        dataset=dataset,
        metrics=metrics,
        llm=evaluator_llm,
        batch_size=1,
        raise_exceptions=False,
    )

    df = result.to_pandas()

    print("\n" + "=" * 70)
    print("INDIVIDUAL CONTEXT PRECISION RESULTS")
    print("=" * 70)

    print(
        df[
            [
                "user_input",
                "context_precision",
            ]
        ].to_string(index=False)
    )

    df.to_csv(
        "evaluation/groq_context_precision.csv",
        index=False,
        encoding="utf-8",
    )

    print("\nSaved to:")
    print("evaluation/groq_context_precision.csv")


if __name__ == "__main__":
    main()