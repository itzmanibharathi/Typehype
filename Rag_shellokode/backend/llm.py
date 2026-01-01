# llm.py
import os
import requests
import logging
import time
from typing import List, Dict  # ← Fixed: Added Dict import

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY is required in .env")

URL = "https://openrouter.ai/api/v1/chat/completions"
HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "HTTP-Referer": "http://localhost",
    "X-Title": "Local RAG App",
    "Content-Type": "application/json"
}

# Best free & fast model (Dec 31, 2025)
MODEL = "xiaomi/mimo-v2-flash:free"

MAX_RETRIES = 6
BASE_DELAY = 2

def query_grok(context: List[str], question: str) -> str:
    """
    Generates answer using OpenRouter free model.
    """
    if not context:
        context = ["No relevant documents found."]

    ctx = "\n\n".join(context)

    prompt = f"""You are a helpful and accurate assistant.
Use ONLY the provided context to answer the question.

Context:
{ctx}

Question: {question}

Answer clearly and concisely. If you cannot answer from the context, say "I don't know based on the documents."
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