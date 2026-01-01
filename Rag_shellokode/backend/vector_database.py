# vector_database.py - UPDATED VERSION (use collection_name, remove redundant user_id filter)

import os
import asyncio
import uuid
import logging
from typing import List, Dict
from dotenv import load_dotenv

from voyageai import Client as VoyageClient
from voyageai.error import VoyageError
from qdrant_client import QdrantClient
from qdrant_client.models import (
    VectorParams,
    Distance,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    PayloadSchemaType,
)

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

voyage_client = VoyageClient(api_key=os.getenv("VOYAGE_API_KEY"))

qdrant_client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
    timeout=60.0
)

SAFE_BATCH_SIZE = 8
BASE_DELAY = 20
MAX_RETRIES = 10

ESTIMATED_BYTES_PER_CHUNK = 1024 * 4 + 1000
USER_STORAGE_LIMIT_MB = 500

async def ensure_payload_indexes(collection_name: str):
    """Force-create keyword indexes for source if missing, with polling"""
    required = {"source": PayloadSchemaType.KEYWORD}
    
    try:
        info = qdrant_client.get_collection(collection_name)
        # FIXED: Use info.payload_schema (dict[field: PayloadSchemaInfo]), not info.config.payload_schema
        existing = {field: schema.data_type for field, schema in info.payload_schema.items()}
        
        for field, schema in required.items():
            if field not in existing or existing[field] != schema:
                logger.info(f"Creating/repairing payload index for '{field}' in {collection_name}")
                qdrant_client.create_payload_index(
                    collection_name=collection_name,
                    field_name=field,
                    field_schema=schema
                )
                # Poll until index appears (Qdrant creation is async)
                for attempt in range(10):
                    await asyncio.sleep(3)  # Increased sleep
                    info = qdrant_client.get_collection(collection_name)
                    existing = {f: s.data_type for f, s in info.payload_schema.items()}
                    if field in existing and existing[field] == schema:
                        logger.info(f"Index for '{field}' confirmed after {attempt+1} attempts")
                        break
                else:
                    raise RuntimeError(f"Failed to confirm index for {field} after 10 attempts")
    except Exception as e:
        logger.error(f"Failed to ensure indexes for {collection_name}: {e}")
        raise  # Now raise to prevent proceeding without indexes

async def embed_and_store(chunks: List[str], source: str, collection_name: str) -> int:
    
    collections = qdrant_client.get_collections().collections
    collection_names = [c.name for c in collections]
    
    if collection_name not in collection_names:
        logger.info(f"Creating new collection: {collection_name}")
        qdrant_client.create_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE)
        )
    
    # ALWAYS ensure indexes exist
    await ensure_payload_indexes(collection_name)

    if not chunks:
        return 0

    stored = 0
    for i in range(0, len(chunks), SAFE_BATCH_SIZE):
        batch = chunks[i:i + SAFE_BATCH_SIZE]
        embeddings = await embed_batch_with_retry(batch)

        points = [
            PointStruct(
                id=str(uuid.uuid4()),
                vector=emb,
                payload={
                    "text": chunk,
                    "source": source,
                    "chunk_index": i + j
                }
            )
            for j, (emb, chunk) in enumerate(zip(embeddings, batch))
        ]

        qdrant_client.upsert(collection_name=collection_name, points=points)
        stored += len(batch)

        if i + SAFE_BATCH_SIZE < len(chunks):
            await asyncio.sleep(BASE_DELAY)

    logger.info(f"Stored {stored} chunks from '{source}' in {collection_name}")
    return stored

async def embed_batch_with_retry(batch: List[str]) -> List[List[float]]:
    for attempt in range(MAX_RETRIES):
        try:
            response = voyage_client.contextualized_embed(
                model="voyage-context-3",
                inputs=[batch],
                input_type="document"
            )
            return response.results[0].embeddings
        except VoyageError as e:
            msg = str(e).lower()
            if "rate limit" in msg or "rpm" in msg or "tpm" in msg:
                wait = BASE_DELAY + (attempt * 10)
                logger.warning(f"Rate limited. Waiting {wait}s...")
                await asyncio.sleep(wait)
                continue
            raise
        except Exception:
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(10 * (2 ** attempt))
                continue
            raise

async def search_relevant_chunks(question: str, collection_name: str, top_k: int = 8) -> List[Dict]:
    
    collections = [c.name for c in qdrant_client.get_collections().collections]
    if collection_name not in collections:
        logger.info(f"No collection {collection_name}")
        return []

    # Ensure indexes before search
    await ensure_payload_indexes(collection_name)

    try:
        resp = voyage_client.contextualized_embed(
            model="voyage-context-3",
            inputs=[[question]],
            input_type="query"
        )
        vector = resp.results[0].embeddings[0]
    except Exception as e:
        logger.error(f"Embedding failed: {e}")
        return []

    try:
        results = qdrant_client.query_points(
            collection_name=collection_name,
            query=vector,
            limit=top_k,
            with_payload=True,
            with_vectors=False,
        )
        return [
            {
                "text": p.payload["text"],
                "source": p.payload["source"],
                "chunk_index": p.payload["chunk_index"],
                "score": p.score
            }
            for p in results.points
        ]
    except Exception as e:
        logger.error(f"Qdrant search error: {e}")
        return []

async def delete_user_document(collection_name: str, filename: str):
    
    collections = [c.name for c in qdrant_client.get_collections().collections]
    if collection_name not in collections:
        logger.info(f"No collection {collection_name} - nothing to delete")
        return

    # Ensure indexes before delete
    await ensure_payload_indexes(collection_name)

    filter_cond = Filter(
        must=[
            FieldCondition(key="source", match=MatchValue(value=filename))
        ]
    )

    try:
        result = qdrant_client.delete(
            collection_name=collection_name,
            points_selector=filter_cond
        )
        logger.info(f"Successfully deleted '{filename}' from {collection_name}: {result}")
    except Exception as e:
        logger.error(f"Delete failed for '{filename}': {e}")
        raise  # Let FastAPI return 500 with detail

def get_collection_stats(collection_name: str) -> Dict:
    try:
        info = qdrant_client.get_collection(collection_name)
        total_chunks = info.points_count
        used_mb = round((total_chunks * ESTIMATED_BYTES_PER_CHUNK) / (1024 * 1024), 2)
        available_mb = max(0, round(USER_STORAGE_LIMIT_MB - used_mb, 2))
        return {
            "total_chunks": total_chunks,
            "used_mb": used_mb,
            "available_mb": available_mb,
            "limit_mb": USER_STORAGE_LIMIT_MB
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return {
            "total_chunks": 0,
            "used_mb": 0,
            "available_mb": USER_STORAGE_LIMIT_MB,
            "limit_mb": USER_STORAGE_LIMIT_MB
        }