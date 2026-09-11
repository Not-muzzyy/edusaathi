## 2024-05-24 - [Path Traversal in FAISS Deserialization]
**Vulnerability:** A path traversal vulnerability existed in `modules/validation.py` where a user-controlled `store_path` could be arbitrary directories. `FAISS.load_local` with `allow_dangerous_deserialization=True` would then load files from these arbitrary locations, resulting in a potential RCE risk.
**Learning:** Functions doing dangerous deserializations (like `pickle` in Python, heavily used by AI tools) must only ever operate on strictly validated paths that guarantee no user input can influence the location.
**Prevention:** Always validate user-provided paths with `os.path.commonpath([abs_vector_dir, abs_store]) == abs_vector_dir` before passing it to any IO functions, especially deserializations.

## 2024-05-24 - [Defense-in-Depth for Deserialization]
**Vulnerability:** A bypass for a previously fixed path traversal vulnerability was discovered. While `safe_retrieve_context` protected some routes, `create_flashcards_from_store` in `modules/flashcard_generator.py` directly called the lower-level `retrieve_context` without validation, exposing the application to RCE via FAISS deserialization.
**Learning:** Security validation functions acting as wrappers (like `safe_retrieve_context`) can easily be bypassed by new or existing code. Security checks should be enforced at the lowest level possible, closer to the dangerous operation.
**Prevention:** In addition to wrapper functions, validate user inputs directly inside the lower-level utility functions (e.g., adding `validate_vector_store` directly in `retrieve_context` before `FAISS.load_local`) to implement defense-in-depth.
