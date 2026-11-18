
import asyncio
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from ragas.metrics._context_precision import ContextPrecisionPrompt
from ragas.metrics._context_precision import QAC

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
RUN_PATH = BASE_DIR / "runs" / "evaluation_01.json"

QUESTION = (
    "How much and by what percentage did revenue increase "
    "from May to June 2026?"
)

async def main():
    if not os.getenv("GROQ_API_KEY"):
        raise RuntimeError("GROQ_API_KEY is missing from your environment.")

    with open(RUN_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    record = next(
        (r for r in records if r.get("user_input", "").strip() == QUESTION),
        None,
    )

    if record is None:
        raise RuntimeError("Q6 was not found in the saved evaluation run.")

    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
    )

    prompt = ContextPrecisionPrompt()

    for index, context in enumerate(record["retrieved_contexts"], start=1):
        result = await prompt.generate(
            data=QAC(
                question=record["user_input"],
                context=context,
                answer=record["reference"],
            ),
            llm=llm,
        )

        print(f"\n--- Context {index} ---")
        print("Verdict:", result.verdict)
        print("Reason:", result.reason)

if __name__ == "__main__":
    asyncio.run(main())
