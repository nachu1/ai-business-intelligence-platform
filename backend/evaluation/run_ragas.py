import json

from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    Faithfulness,
    ContextPrecision,
    ContextRecall,
)

from langchain_ollama import ChatOllama




def main():
    with open(
        "evaluation/results.json",
        "r",
        encoding="utf-8",
    ) as file:
        results = json.load(file)

    dataset = Dataset.from_list(results)

    evaluator_llm = ChatOllama(
      model="qwen2.5:3b",
      base_url="http://localhost:11434",
      temperature=0,
    )

    metrics = [
        Faithfulness(llm=evaluator_llm),
        ContextPrecision(llm=evaluator_llm),
        ContextRecall(llm=evaluator_llm),
    ]

    result = evaluate(
        dataset=dataset,
        metrics=metrics,
        llm=evaluator_llm,
        batch_size=1,
        raise_exceptions=False,
    )

    print("\n" + "=" * 60)
    print("RAGAS EVALUATION RESULTS")
    print("=" * 60)
    print(result)


if __name__ == "__main__":
    main()