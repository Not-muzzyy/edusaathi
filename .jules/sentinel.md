## 2024-05-24 - [Path Traversal in FAISS Deserialization]
**Vulnerability:** A path traversal vulnerability existed in `modules/validation.py` where a user-controlled `store_path` could be arbitrary directories. `FAISS.load_local` with `allow_dangerous_deserialization=True` would then load files from these arbitrary locations, resulting in a potential RCE risk.
**Learning:** Functions doing dangerous deserializations (like `pickle` in Python, heavily used by AI tools) must only ever operate on strictly validated paths that guarantee no user input can influence the location.
**Prevention:** Always validate user-provided paths with `os.path.commonpath([abs_vector_dir, abs_store]) == abs_vector_dir` before passing it to any IO functions, especially deserializations.

## 2024-05-18 - Overly Permissive CORS Configuration
**Vulnerability:** The backend FastAPI server's CORS middleware allowed all origins (`allow_origins=["*"]`) while simultaneously allowing credentials (`allow_credentials=True`).
**Learning:** This is a High-severity vulnerability. Setting `allow_origins=["*"]` with `allow_credentials=True` allows cross-origin requests from any site to be made with the user's credentials (like cookies or auth headers), enabling CSRF-like and data leakage attacks if an attacker tricks a user into visiting a malicious site. FastAPI typically rejects this combination, but it's crucial to ensure origins are explicitly restricted.
**Prevention:** Always restrict `allow_origins` to explicitly trusted domains, typically by loading them from environment variables (e.g., `FRONTEND_URL`), and never use `*` when `allow_credentials=True`.
