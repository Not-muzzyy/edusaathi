## 2024-05-24 - [Path Traversal in FAISS Deserialization]
**Vulnerability:** A path traversal vulnerability existed in `modules/validation.py` where a user-controlled `store_path` could be arbitrary directories. `FAISS.load_local` with `allow_dangerous_deserialization=True` would then load files from these arbitrary locations, resulting in a potential RCE risk.
**Learning:** Functions doing dangerous deserializations (like `pickle` in Python, heavily used by AI tools) must only ever operate on strictly validated paths that guarantee no user input can influence the location.
**Prevention:** Always validate user-provided paths with `os.path.commonpath([abs_vector_dir, abs_store]) == abs_vector_dir` before passing it to any IO functions, especially deserializations.

## 2024-05-24 - [Missing Audience Validation in OAuth]
**Vulnerability:** Google OAuth token validation in `backend/api/auth.py` was checking token validity and user claims but failed to validate the `aud` (audience) claim against the expected client ID. This exposes the app to Confused Deputy attacks, where a valid token issued to a different application could be used to authenticate maliciously.
**Learning:** Always validate the `aud` claim in third-party identity tokens (like Google OAuth) matches the client ID of your application. Relying solely on the token signature and issuer verification is insufficient for authorization.
**Prevention:** Implement checks against `os.environ.get("VITE_GOOGLE_CLIENT_ID")` or similar configuration for the `aud` field when processing external identity tokens.
