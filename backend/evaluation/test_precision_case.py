import asyncio

from ragas import SingleTurnSample
from ragas.metrics import LLMContextPrecisionWithoutReference

from langchain_groq import ChatGroq

import os
from dotenv import load_dotenv

load_dotenv(override=True)


async def main():

    evaluator_llm = ChatGroq(
        model="openai/gpt-oss-120b",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0,
    )

    metric = LLMContextPrecisionWithoutReference(
        llm=evaluator_llm
    )

    sample = SingleTurnSample(
        user_input="Compare March and April revenue.",

        retrieved_contexts=[
            (
                "ABC Retail Pvt. Ltd.\n"
                "Monthly Sales Report - April 2026\n"
                "Total Revenue\n"
                "₹9,20,000\n"
                "Total Expenses\n"
                "₹6,50,000\n"
                "Net Profit\n"
                "₹2,70,000"
            ),
            (
                "ABC Retail Pvt. Ltd.\n"
                "Monthly Sales Report - March 2026\n"
                "Total Revenue\n"
                "₹8,50,000\n"
                "Total Expenses\n"
                "₹6,20,000\n"
                "Net Profit\n"
                "₹2,30,000"
            ),
        ],

        response=(
            "Here's a comparison of revenue for March and April:\n\n"
            "March 2026 Total Revenue: ₹8,50,000\n"
            "April 2026 Total Revenue: ₹9,20,000\n\n"
            "Revenue increased from March to April."
        ),
    )

    score = await metric.single_turn_ascore(sample)

    print("\n" + "=" * 60)
    print("CONTEXT PRECISION WITHOUT REFERENCE")
    print("=" * 60)
    print("Score:", score)


if __name__ == "__main__":
    asyncio.run(main())