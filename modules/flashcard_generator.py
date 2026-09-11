"""modules/flashcard_generator.py — Flashcard helpers."""
from modules.llm_client import generate_flashcards
from modules.validation import safe_retrieve_context


def create_flashcards_from_store(store_path: str, topic: str = "", n: int = 10) -> list:
    """Retrieve context and generate flashcards."""
    query = topic if topic else "key concepts definitions terms"
    context = safe_retrieve_context([store_path], query, top_k=6)
    if not context:
        return []
    return generate_flashcards(context, n=n)
