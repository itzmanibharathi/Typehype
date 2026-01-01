import os
import uuid
import hashlib
import requests
import tempfile

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
from datetime import datetime

from document_inject import extract_text, chunk_text
from vector_database import (
    embed_and_store,
    search_relevant_chunks,
    delete_user_document,
    get_collection_stats,
)
from database import users, documents


# ================== ENV SETUP ==================

load_dotenv()

app = FastAPI(title="TypeHype RAG Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()


# ================== OPENROUTER CONFIG ==================

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise ValueError("OPENROUTER_API_KEY required in .env")

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

OPENROUTER_HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
}

# Best free model as of December 31, 2025
OPENROUTER_MODEL = "xiaomi/mimo-v2-flash:free"


# ================== MODELS ==================

class RegisterRequest(BaseModel):
    firstName: str
    lastName: str
    email: str
    phoneNumber: str
    password: str
    profilePicture: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class QueryRequest(BaseModel):
    question: str


class DeleteRequest(BaseModel):
    filename: str


# ================== AUTH ==================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials
    user = users.find_one({"user_id": token})

    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def query_with_openrouter(context: List[str], question: str) -> str:
    # Send top 8 chunks for better context (free tier friendly)
    ctx = "\n\n".join(context[:8]) if context else "No relevant documents uploaded."

    prompt = f"""You are a precise and helpful AI assistant for a document Q&A system.

Use ONLY the provided context from the user's documents to answer. Do not add external knowledge.

Context:
{ctx}

Question: {question}

Guidelines:
- Answer accurately and concisely using the context.
- If relevant information exists in the context (even partial), provide the best possible answer based on it.
- Only if truly no relevant information is present, say: "I don't have sufficient information from your documents to answer this accurately."
- For chart requests: First explain in text, then if numerical data exists, output structured Chart.js JSON in the exact format specified.

Answer now:"""

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.4,
        "max_tokens": 2048
    }

    try:
        response = requests.post(OPENROUTER_URL, headers=OPENROUTER_HEADERS, json=payload, timeout=45)
        if response.status_code == 200:
            answer = response.json()["choices"][0]["message"]["content"].strip()
            return answer or "No answer generated."
        else:
            logger.warning(f"HTTP {response.status_code}: {response.text}")
            return "Temporary service issue."
    except Exception as e:
        logger.error(f"LLM error: {e}")
        return "I'm having trouble responding. Please try again."


@app.post("/query")
async def query(req: QueryRequest, user=Depends(get_current_user)):
    collection_name = user.get("vector_collection")
    if not collection_name:
        raise HTTPException(400, "No vector collection for user")

    results = await search_relevant_chunks(
        req.question,
        collection_name=collection_name,
        top_k=10  # Increased to 10 chunks
    )

    context = [r.get("text", "") for r in results]
    if not any(context):
        context = ["No relevant information found in your uploaded documents."]

    answer = query_with_openrouter(context, req.question)

    return {
        "answer": answer,
        "sources_used": len([c for c in context if c.strip()]),
    }

# ================== ROUTES ==================

@app.get("/")
async def root():
    return {
        "message": (
            "TypeHype Backend Running – Optimized for Charts & "
            "Latest Best Free Model (Dec 31, 2025) 🚀"
        )
    }


@app.post("/register")
async def register(data: RegisterRequest):
    if users.find_one({"email": data.email}):
        raise HTTPException(400, detail="Email already registered")

    base_username = (data.firstName + data.lastName).lower().replace(" ", "")
    username = base_username
    counter = 1

    while users.find_one({"username": username}):
        username = f"{base_username}{counter}"
        counter += 1

    user_id = str(uuid.uuid4())[-8:]
    vector_collection = f"rag_{username}"

    users.insert_one(
        {
            "user_id": user_id,
            "firstName": data.firstName,
            "lastName": data.lastName,
            "email": data.email,
            "phoneNumber": data.phoneNumber,
            "password": hash_password(data.password),
            "username": username,
            "profilePicture": data.profilePicture,
            "vector_collection": vector_collection,
            "created_at": datetime.utcnow(),
        }
    )

    return {"message": "Registered!", "username": username, "user_id": user_id}


@app.post("/login")
async def login(data: LoginRequest):
    user = users.find_one(
        {
            "email": data.email,
            "password": hash_password(data.password),
        }
    )

    if not user:
        raise HTTPException(401, detail="Invalid email or password")

    return {"token": user["user_id"]}



@app.get("/me")
async def me(user=Depends(get_current_user)):
    return {
        "id": user["user_id"],
        "firstName": user["firstName"],
        "lastName": user["lastName"],
        "email": user["email"],
        "phoneNumber": user["phoneNumber"],
        "profilePicture": user.get("profilePicture"),
        "username": user["username"],
    }


@app.post("/embed")
async def embed(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    user_id = user["user_id"]
    collection_name = user.get("vector_collection")
    if not collection_name:
        raise HTTPException(400, "No vector collection for user")
    filename = file.filename
    tmp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=os.path.splitext(filename)[1],
        ) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        text = extract_text(tmp_path, filename)
        if not text.strip():
            raise HTTPException(400, "No text extracted from file")

        chunks = chunk_text(text)
        chunk_count = await embed_and_store(chunks, filename, collection_name)

        documents.update_one(
            {"user_id": user_id, "filename": filename},
            {
                "$set": {
                    "chunks_stored": chunk_count,
                    "uploaded_at": datetime.utcnow(),
                }
            },
            upsert=True,
        )

        return {
            "message": "Success!",
            "chunks_stored": chunk_count,
            "filename": filename,
        }

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
@app.post("/delete")
async def delete(req: DeleteRequest, user=Depends(get_current_user)):
    user_id = user["user_id"]
    collection_name = user.get("vector_collection")
    if not collection_name:
        raise HTTPException(400, "No vector collection for user")
    filename = req.filename

    await delete_user_document(collection_name, filename)
    documents.delete_one({"user_id": user_id, "filename": filename})

    return {"message": f"{filename} deleted successfully"}


@app.get("/my-docs")
async def my_docs(user=Depends(get_current_user)):
    docs = list(documents.find({"user_id": user["user_id"]}))

    return {
        "documents": [
            {
                "filename": d["filename"],
                "chunks_stored": d.get("chunks_stored", 0),
                "uploaded_at": d["uploaded_at"].isoformat(),
            }
            for d in docs
        ]
    }


@app.get("/collection-stats")
async def collection_stats(user=Depends(get_current_user)):
    collection_name = user.get("vector_collection")
    if not collection_name:
        raise HTTPException(400, "No vector collection for user")
    return get_collection_stats(collection_name)

@app.get("/test-llm")
async def test_llm():
    answer = query_with_openrouter(
        context=["Paris is the capital of France."],
        question="What is the capital of France?"
    )
    return {"answer": answer}

# ================== RUN ==================

if __name__ == "__main__":
    import uvicorn


    uvicorn.run( "main:app",  host="127.0.0.1",  port=8000,  reload=True)

