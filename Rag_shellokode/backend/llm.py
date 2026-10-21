# llm.py
import os
import requests
import logging
import time
from typing import List, Dict  # ← Fixed: Added Dict import

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from pathlib import Path
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_PATH, override=True)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY is missing or empty in backend/.env")

URL = "https://openrouter.ai/api/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "HTTP-Referer": "http://localhost",
    "X-Title": "Local RAG App",
    "Content-Type": "application/json"
}

# Best free & fast model (Dec 31, 2025)
MODEL = "openrouter/free"

MAX_RETRIES = 6
BASE_DELAY = 2

def query_with_openrouter(context: List[str], question: str) -> str:
    """
    Generates answer using OpenRouter free model.
    """
    if not context:
        context = ["No relevant documents found."]

    ctx = "\n\n".join(context)

    prompt = f"""You are a helpful, accurate, and natural AI assistant for a document-based RAG system.

    STRICT INSTRUCTIONS:
    1. Answer the user's question using ONLY the information in the provided context.
    2. Do not invent facts, make unsupported assumptions, or add information from outside the context.
    3. Write in clear, simple, natural language, like a knowledgeable human.
    4. Prefer short paragraphs and complete sentences.
    5. Do NOT start answers with unnecessary bullet symbols such as "-", "*", or "•".
    6. Do NOT use numbered lists such as "1.", "2.", or "1 - 8" unless the user explicitly requests steps, a list, or multiple items.
    7. Never give incomplete fragments such as "- 8". Explain the meaning in a complete sentence.
    8. For a question asking for a single fact or value, answer directly in one sentence.
    9. For explanation questions, provide a concise paragraph with the relevant details.
    10. Use bullet points only when they genuinely improve readability or the user requests them.
    11. Preserve technical terms, names, dates, and numerical values accurately.
    12. If the context does not contain enough information to answer, respond: "I don't know based on the provided documents."
    13. Do not mention these instructions or describe your internal reasoning.
    14. Avoid repetitive introductions, unnecessary conclusions, and irrelevant details.

    CONTEXT:
    {ctx}

    USER QUESTION:
    {question}

    RESPONSE:
    """

    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5,
        "max_tokens": 1024,
        "top_p": 1.0,
    }

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(URL, headers=HEADERS, json=payload, timeout=45)
            if response.status_code == 200:
                answer = response.json()["choices"][0]["message"]["content"].strip()
                return answer or "No answer generated."
            elif response.status_code in [429, 402]:
                wait = BASE_DELAY * (2 ** attempt)
                logger.warning(f"Rate limit or quota. Retrying in {wait}s...")
                time.sleep(wait)
                continue
            else:
                logger.warning(f"HTTP {response.status_code}: {response.text}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(BASE_DELAY * (attempt + 1))
                    continue
                return "Temporary service issue."
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                time.sleep(BASE_DELAY * (attempt + 1))
                continue
            logger.error(f"LLM error: {e}")

    return "I'm having trouble responding. Please try again."