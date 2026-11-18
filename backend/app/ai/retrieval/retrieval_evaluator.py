

import json

from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate

from app.ai.langchain_llm import llm, groq_llm


evaluator_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            """
You are a retrieval evidence evaluator, not an answer generator.

Determine whether the retrieved documents contain sufficient,
relevant, and reliable evidence to answer the user's question.

Check:
1. Whether the evidence directly supports the question.
2. Whether all required facts are present, including values needed
   for calculations or comparisons.
3. Whether the evidence is contradictory, irrelevant, or insufficient.
4. Whether any evidence is explicitly synthetic or illustrative.
   Do not treat synthetic details as source-grounded facts.

Return ONLY valid JSON in this exact structure:

{{
    "answerable": true,
    "selected_document_indexes": [0, 2],
    "reason": "Both documents provide the required evidence."
}}

Rules:
- Document indexes are zero-based.
- Select only documents that provide useful, relevant evidence.
- For calculations or comparisons, select documents covering all
  required facts.
- Set answerable to false if essential evidence is missing,
  unreliable, or contradictory.
- Never invent missing information.
- Do not calculate the final answer or answer the user's question.
- Keep reason to ONE short sentence.
- Do not include Markdown fences or text outside the JSON.
""",
        ),
        (
            "human",
            """
Original user question:
{question}

Search query used for retrieval:
{search_query}

Retrieved documents:
{documents}
""",
        ),
    ]
)


def parse_evaluator_response(response):
    raw_content = response.content

    if isinstance(raw_content, list):
        raw_content = "".join(
            str(item)
            for item in raw_content
        )

    raw_content = str(raw_content).strip()

    # Handle JSON returned inside Markdown code fences.
    if raw_content.startswith("```"):
        lines = raw_content.splitlines()

        if lines and lines[0].strip().startswith("```"):
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        raw_content = "\n".join(lines).strip()

    result = json.loads(raw_content)

    if not isinstance(result, dict):
        raise ValueError(
            "Invalid evaluator response structure."
        )

    if not isinstance(result.get("answerable"), bool):
        raise ValueError(
            "Evaluator answerable field must be a boolean."
        )

    selected_indexes = result.get(
        "selected_document_indexes"
    )

    if not isinstance(selected_indexes, list):
        raise ValueError(
            "Invalid selected document indexes."
        )

    return result


async def invoke_gemini_evaluator(
    question: str,
    search_query: str,
    documents_text: str,
):
    chain = evaluator_prompt | llm

    return await chain.ainvoke(
        {
            "question": question,
            "search_query": search_query,
            "documents": documents_text,
        },
        config={
            "tags": ["retrieval_evaluator"],
        },
    )


async def invoke_groq_evaluator(
    question: str,
    search_query: str,
    documents_text: str,
):
    # Enable JSON mode for Groq.
    groq_json_llm = groq_llm.bind(
        response_format={
            "type": "json_object"
        }
    )

    chain = evaluator_prompt | groq_json_llm

    return await chain.ainvoke(
        {
            "question": question,
            "search_query": search_query,
            "documents": documents_text,
        },
        config={
            "tags": ["retrieval_evaluator"],
        },
    )


async def evaluate_retrieval(
    question: str,
    search_query: str,
    documents: list[Document],
    provider: str = "gemini",
):
    if not documents:
        return {
            "answerable": False,
            "selected_document_indexes": [],
            "reason": "No documents were retrieved.",
            "selected_documents": [],
        }

    formatted_documents = []

    for index, document in enumerate(documents):

        score = document.metadata.get(
            "rerank_score",
            "unknown",
        )

        formatted_documents.append(
            f"""
DOCUMENT INDEX: {index}
RERANK SCORE: {score}

{document.page_content}
"""
        )

    documents_text = "\n".join(
        formatted_documents
    )

    result = None
    selected_provider = None

    # -----------------------------------------------------
    # PROVIDER-AWARE EVALUATION
    # -----------------------------------------------------

    if provider.lower() == "groq":

        # Supervisor already selected Groq.
        # Avoid an unnecessary Gemini request.
        try:
            print(
                "RETRIEVAL EVALUATOR: Using Groq directly",
                flush=True,
            )

            response = await invoke_groq_evaluator(
                question,
                search_query,
                documents_text,
            )

            result = parse_evaluator_response(response)
            selected_provider = "Groq"

        except Exception as error:

            print(
                f"Groq Retrieval Evaluator Failed: {error!r}",
                flush=True,
            )

            return {
                "answerable": False,
                "selected_document_indexes": [],
                "reason": (
                    "Groq retrieval evaluator failed "
                    "to produce a valid evaluation."
                ),
                "selected_documents": [],
            }

    else:

        # Gemini first, Groq fallback.
        try:
            print(
                "RETRIEVAL EVALUATOR: Trying Gemini",
                flush=True,
            )

            response = await invoke_gemini_evaluator(
                question,
                search_query,
                documents_text,
            )

            result = parse_evaluator_response(response)
            selected_provider = "Gemini"

        except Exception as error:

            print(
                f"Gemini Retrieval Evaluator Failed: {error!r}",
                flush=True,
            )

            print(
                "RETRIEVAL EVALUATOR: Switching to Groq",
                flush=True,
            )

            try:
                response = await invoke_groq_evaluator(
                    question,
                    search_query,
                    documents_text,
                )

                result = parse_evaluator_response(response)
                selected_provider = "Groq"

            except Exception as groq_error:

                print(
                    f"Groq Retrieval Evaluator Failed: {groq_error!r}",
                    flush=True,
                )

                return {
                    "answerable": False,
                    "selected_document_indexes": [],
                    "reason": (
                        "Both retrieval evaluators failed "
                        "to produce a valid evaluation."
                    ),
                    "selected_documents": [],
                }

    print(
        "RETRIEVAL EVALUATOR PROVIDER:",
        selected_provider,
        flush=True,
    )

    # -----------------------------------------------------
    # VALIDATE EVALUATOR RESULT
    # -----------------------------------------------------

    answerable = result.get("answerable") is True

    selected_indexes = result.get(
        "selected_document_indexes",
        [],
    )

    valid_indexes = list(
        dict.fromkeys(
            index
            for index in selected_indexes
            if isinstance(index, int)
            and not isinstance(index, bool)
            and 0 <= index < len(documents)
        )
    )

    # Never accept an answerable result without selected evidence.
    if not answerable or not valid_indexes:
        answerable = False
        valid_indexes = []

    selected_documents = [
        documents[index]
        for index in valid_indexes
    ]

    reason = result.get("reason", "")

    if not isinstance(reason, str):
        reason = ""

    return {
        "answerable": answerable,
        "selected_document_indexes": valid_indexes,
        "reason": reason,
        "selected_documents": selected_documents,
    }
