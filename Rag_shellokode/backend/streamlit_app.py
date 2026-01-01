# streamlit_app.py
import streamlit as st
import requests
import hashlib
import secrets
from datetime import datetime
from database import users, documents

st.set_page_config(page_title="My RAG System", layout="centered")
st.title("📄 Personal Document Assistant")

BACKEND_URL = "http://127.0.0.1:8000"

def hash_password(p): return hashlib.sha256(p.encode()).hexdigest()

def suggest_username(name):
    base = "".join(c for c in name.lower() if c.isalnum())
    username = base
    i = 1
    while users.find_one({"username": username}):
        username = f"{base}{i}"
        i += 1
    return username

if "token" not in st.session_state:
    st.session_state.token = None
if "page" not in st.session_state:
    st.session_state.page = "Login"

if st.session_state.token:
    st.sidebar.success("Logged in")
    pages = ["Upload", "Query", "My Documents", "Delete", "Logout"]
else:
    pages = ["Register", "Login"]

page = st.sidebar.radio("Menu", pages, index=pages.index(st.session_state.page) if st.session_state.page in pages else 0)

if page == "Logout":
    st.session_state.token = None
    st.session_state.page = "Login"
    st.rerun()

if not st.session_state.token:
    if page == "Register":
        st.header("Register")
        with st.form("reg"):
            name = st.text_input("Name")
            pwd = st.text_input("Password", type="password")
            confirm = st.text_input("Confirm", type="password")
            sub = st.form_submit_button("Register")
            if sub:
                if pwd != confirm:
                    st.error("Passwords don't match")
                else:
                    username = suggest_username(name)
                    uid = secrets.token_hex(8)
                    users.insert_one({"name": name, "username": username, "user_id": uid, "password": hash_password(pwd)})
                    st.success("Registered!")
                    st.info(f"Username: **{username}**")
                    st.info(f"User ID (for login): **{uid}**")

    elif page == "Login":
        st.header("Login")
        with st.form("login"):
            uid = st.text_input("User ID")
            pwd = st.text_input("Password", type="password")
            sub = st.form_submit_button("Login")
            if sub:
                user = users.find_one({"user_id": uid, "password": hash_password(pwd)})
                if user:
                    st.session_state.token = uid
                    st.session_state.user = user
                    st.session_state.page = "Upload"
                    st.rerun()
                else:
                    st.error("Invalid credentials")
else:
    headers = {"Authorization": f"Bearer {st.session_state.token}"}
    st.sidebar.info(f"User: {st.session_state.user['name']} (@{st.session_state.user['username']})")

    if page == "Upload":
        st.header("Upload Document")
        file = st.file_uploader("PDF/DOCX/TXT", type=["pdf", "docx", "txt"])
        if file and st.button("Upload"):
            files = {"file": (file.name, file.getvalue())}
            r = requests.post(f"{BACKEND_URL}/embed", files=files, headers=headers)
            if r.ok:
                st.success(f"Embedded {r.json()['chunks_stored']} chunks")
            else:
                st.error("Upload failed")

    elif page == "Query":
        st.header("Ask Question")
        q = st.text_input("Question:")
        if st.button("Ask") and q:
            r = requests.post(f"{BACKEND_URL}/query", json={"question": q}, headers=headers)
            if r.ok:
                data = r.json()
                st.write("**Answer:**")
                st.write(data["answer"])
                if data.get("sources"):
                    st.write("Sources:", ", ".join(data["sources"]))
            else:
                st.error("Query failed")

    elif page == "My Documents":
        st.header("My Documents")
        docs = list(documents.find({"user_id": st.session_state.user["user_id"]}))
        for d in docs:
            st.write(f"📄 {d['filename']} — Chunks: {d['chunks_stored']} — {d['uploaded_at'].date()}")

    elif page == "Delete":
        st.header("Delete Document")
        docs = list(documents.find({"user_id": st.session_state.user["user_id"]}))
        if docs:
            fn = st.selectbox("Select file", [d["filename"] for d in docs])
            if st.button("Delete"):
                r = requests.post(f"{BACKEND_URL}/delete", json={"filename": fn}, headers=headers)
                if r.ok:
                    st.success("Deleted")
                    st.rerun()
        else:
            st.info("No documents")



