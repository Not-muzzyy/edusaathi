## 2024-05-24 - [Path Traversal in FAISS Deserialization]
**Vulnerability:** A path traversal vulnerability existed in `modules/validation.py` where a user-controlled `store_path` could be arbitrary directories. `FAISS.load_local` with `allow_dangerous_deserialization=True` would then load files from these arbitrary locations, resulting in a potential RCE risk.
**Learning:** Functions doing dangerous deserializations (like `pickle` in Python, heavily used by AI tools) must only ever operate on strictly validated paths that guarantee no user input can influence the location.
**Prevention:** Always validate user-provided paths with `os.path.commonpath([abs_vector_dir, abs_store]) == abs_vector_dir` before passing it to any IO functions, especially deserializations.

## 2024-05-25 - [Confused Deputy in Google OAuth]
**Vulnerability:** The Google login endpoint `backend/api/auth.py` verified the token signature and email, but failed to verify the `aud` (audience) claim.
**Learning:** Without checking `aud`, an attacker could use a valid Google token issued to a completely different application to authenticate into our backend. This is known as the Confused Deputy problem.
**Prevention:** Always verify the `aud` claim matches the expected `VITE_GOOGLE_CLIENT_ID` when validating tokens from generic endpoints like `tokeninfo` or `userinfo`.
