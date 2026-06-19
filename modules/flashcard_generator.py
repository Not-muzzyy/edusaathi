"""modules/flashcard_generator.py — Flashcard helpers."""
from modules.llm_client import generate_flashcards
from modules.rag_pipeline import retrieve_context


def create_flashcards_from_store(store_path: str, topic: str = "", n: int = 10) -> list:
    """Retrieve context and generate flashcards."""
    query = topic if topic else "key concepts definitions terms"
    context = retrieve_context(query, store_path, top_k=6)
    if not context:
        return []
    return generate_flashcards(context, n=n)
