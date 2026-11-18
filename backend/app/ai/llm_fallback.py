
import asyncio

from app.ai.langchain_llm import gemini_llm, groq_llm


GEMINI_TIMEOUT = 5


async def ainvoke_with_fallback(
    prompt,
    model=None,
    config=None,
):
    primary = model or gemini_llm

    try:
        return await asyncio.wait_for(
            primary.ainvoke(prompt, config=config),
            timeout=GEMINI_TIMEOUT,
        )

    except Exception as error:
        print(
            f"Gemini failed: {error!r}. Switching to Groq.",
            flush=True,
        )

        return await groq_llm.ainvoke(
            prompt,
            config=config,
        )


def with_structured_fallback(
    schema,
    primary_model=None,
):
    primary = primary_model or gemini_llm

    return StructuredFallback(
        primary,
        groq_llm,
        schema,
    )


class StructuredFallback:

    def __init__(self, primary, fallback, schema):
        self.primary = primary.with_structured_output(schema)
        self.fallback = fallback.with_structured_output(schema)

    async def ainvoke(self, prompt, config=None):
        try:
            return await asyncio.wait_for(
                self.primary.ainvoke(prompt, config=config),
                timeout=GEMINI_TIMEOUT,
            )

        except Exception as error:
            print(
                f"Gemini structured call failed: {error!r}. "
                "Switching to Groq.",
                flush=True,
            )

            return await self.fallback.ainvoke(
                prompt,
                config=config,
            )
