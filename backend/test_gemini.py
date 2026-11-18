import asyncio

print("TEST STARTED")

from app.ai.langchain_llm import llm

print("GEMINI MODEL INITIALIZED")


async def main():
    print("SENDING REQUEST TO GEMINI...")

    try:
        response = await asyncio.wait_for(
            llm.ainvoke(
                "Reply with exactly: Gemini connection successful"
            ),
            timeout=30,
        )

        print("GEMINI RESPONSE:", response.content)

    except Exception as error:
        print("GEMINI ERROR:", repr(error))


asyncio.run(main())

print("TEST FINISHED")