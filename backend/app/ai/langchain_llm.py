from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

from app.config import settings


# Primary provider: Gemini
gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-3.7-flash",
    google_api_key=settings.GEMINI_API_KEY,
    thinking_level="low",
    timeout=60,
    max_retries=0,
)


# Fallback provider: Groq
groq_llm = ChatGroq(
    model="openai/gpt-oss-120b",
    api_key=settings.GROQ_API_KEY,
    temperature=0,
    timeout=30,
    max_retries=0,
)


# Keep existing model names for compatibility
llm = gemini_llm
supervisor_llm = gemini_llm
company_tool_llm = gemini_llm
company_answer_llm = gemini_llm