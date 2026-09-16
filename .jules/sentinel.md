## 2024-05-24 - [Path Traversal in FAISS Deserialization]
**Vulnerability:** A path traversal vulnerability existed in `modules/validation.py` where a user-controlled `store_path` could be arbitrary directories. `FAISS.load_local` with `allow_dangerous_deserialization=True` would then load files from these arbitrary locations, resulting in a potential RCE risk.
**Learning:** Functions doing dangerous deserializations (like `pickle` in Python, heavily used by AI tools) must only ever operate on strictly validated paths that guarantee no user input can influence the location.
**Prevention:** Always validate user-provided paths with `os.path.commonpath([abs_vector_dir, abs_store]) == abs_vector_dir` before passing it to any IO functions, especially deserializations.

## 2024-05-14 - Unsafe External API Calls and Error Handing
**Vulnerability:** External HTTP requests (to Google OAuth validation endpoints) lacked timeouts, creating a DoS risk. The endpoint also leaked internal database exception strings to users on failure.
**Learning:** External API integrations should always be defensive, utilizing timeouts and protecting against parameter injection. Uncaught internal exceptions often bypass intended generic error handling.
**Prevention:** Implement timeouts for all `urllib.request` or `httpx` calls. Always sanitize parameters (e.g., `urllib.parse.quote`) interpolated into external URLs. Catch and sanitize backend exception messages before they are returned via FastAPI `HTTPException`.
