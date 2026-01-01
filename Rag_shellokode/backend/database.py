# database.py
import os
from dotenv import load_dotenv
from pymongo import MongoClient
import certifi  # Fixes SSL handshake error

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise ValueError("MONGO_URI required in .env")

# Fixed connection with certifi
client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
db = client["rag_system"]

users = db["users"]
documents = db["documents"]  # Tracks uploaded files per user