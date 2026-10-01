## 2024-05-24 - [Path Traversal in FAISS Deserialization]
**Vulnerability:** A path traversal vulnerability existed in `modules/validation.py` where a user-controlled `store_path` could be arbitrary directories. `FAISS.load_local` with `allow_dangerous_deserialization=True` would then load files from these arbitrary locations, resulting in a potential RCE risk.
**Learning:** Functions doing dangerous deserializations (like `pickle` in Python, heavily used by AI tools) must only ever operate on strictly validated paths that guarantee no user input can influence the location.
**Prevention:** Always validate user-provided paths with `os.path.commonpath([abs_vector_dir, abs_store]) == abs_vector_dir` before passing it to any IO functions, especially deserializations.

## 2024-05-24 - [CORS CSRF Vulnerability]
**Vulnerability:** The FastAPI backend used `allow_origins=["*"]` while setting `allow_credentials=True` in CORS configuration. This is a highly insecure combination that could allow Cross-Site Request Forgery (CSRF) via cross-origin requests holding credentials.
**Learning:** Using `*` for CORS origins is dangerous when `allow_credentials` is true because it permits any site to make authenticated requests to the API on behalf of the user. Most modern frameworks block this outright, but when bypassing those protections or configuring manually, it is a significant risk.
**Prevention:** Always restrict `allow_origins` to a specific list of trusted origins (like the frontend application's URL) when `allow_credentials=True`. Use environment variables to handle different environments (e.g., local dev vs. production).
## 2025-02-24 - Missing audience (aud) validation in Google OAuth token verification
**Vulnerability:** The Google OAuth token verification (`backend/api/auth.py:google_login`) failed to validate the `aud` (audience) claim, allowing valid tokens generated for *other* applications (e.g. evil.com) to successfully authenticate into this application.
**Learning:** This is a classic Confused Deputy vulnerability. When validating external OAuth tokens (like from Google's tokeninfo API), simply verifying the email and signature is insufficient.
**Prevention:** Always validate the `aud` claim against the expected client ID (`VITE_GOOGLE_CLIENT_ID`). When working with Google tokens specifically, handle the fact that the `aud` claim can be returned as either a string or a list of strings, and ensure your code fails securely (500 error) if the client ID environment variable is missing.
