## 2024-05-24 - [Path Traversal in FAISS Deserialization]
**Vulnerability:** A path traversal vulnerability existed in `modules/validation.py` where a user-controlled `store_path` could be arbitrary directories. `FAISS.load_local` with `allow_dangerous_deserialization=True` would then load files from these arbitrary locations, resulting in a potential RCE risk.
**Learning:** Functions doing dangerous deserializations (like `pickle` in Python, heavily used by AI tools) must only ever operate on strictly validated paths that guarantee no user input can influence the location.
**Prevention:** Always validate user-provided paths with `os.path.commonpath([abs_vector_dir, abs_store]) == abs_vector_dir` before passing it to any IO functions, especially deserializations.

## 2024-05-24 - [CORS CSRF Vulnerability]
**Vulnerability:** The FastAPI backend used `allow_origins=["*"]` while setting `allow_credentials=True` in CORS configuration. This is a highly insecure combination that could allow Cross-Site Request Forgery (CSRF) via cross-origin requests holding credentials.
**Learning:** Using `*` for CORS origins is dangerous when `allow_credentials` is true because it permits any site to make authenticated requests to the API on behalf of the user. Most modern frameworks block this outright, but when bypassing those protections or configuring manually, it is a significant risk.
**Prevention:** Always restrict `allow_origins` to a specific list of trusted origins (like the frontend application's URL) when `allow_credentials=True`. Use environment variables to handle different environments (e.g., local dev vs. production).
## 2025-02-14 - Google OAuth Confused Deputy Vulnerability
**Vulnerability:** Google OAuth token validation in `backend/api/auth.py` did not verify the `aud` (audience) claim against the application's client ID.
**Learning:** This missing check could allow an attacker to use a valid Google token issued to a different application (like a malicious app the user installed) to authenticate as that user on our platform (Confused Deputy attack). The backend environment might have `VITE_GOOGLE_CLIENT_ID` (due to sharing the env file with Vite) or `GOOGLE_CLIENT_ID`, so it should check both. Also, the `aud` claim can be either a string or a list.
**Prevention:** Always verify the `aud` claim matches your application's specific Client ID when verifying third-party identity tokens. Ensure the code fails securely (closed) if the configuration is missing, and handle multiple expected data types (string/list) for the audience claim.
