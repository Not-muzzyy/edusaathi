from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.flashcard_generator import create_flashcards_from_store
from modules.auth import save_flashcards, get_user_flashcards
from typing import List, Optional

router = APIRouter(prefix="/api/flashcards", tags=["flashcards"])

class GenerateFlashcardsRequest(BaseModel):
    user_id: int
    document_id: int
    vector_store_path: str
    topic_hint: Optional[str] = ""
    n_cards: int = 10

@router.post("/generate")
def generate_cards(req: GenerateFlashcardsRequest):
    try:
        cards = create_flashcards_from_store(
            req.vector_store_path,
            topic=req.topic_hint,
            n=req.n_cards
        )
        if not cards:
            raise HTTPException(status_code=500, detail="Could not generate flashcards. Please try a different topic.")
            
        save_flashcards(req.user_id, req.document_id, cards)
        return {"message": f"Successfully created {len(cards)} flashcards.", "cards": cards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate flashcards: {str(e)}")

@router.get("/{user_id}")
def get_cards(user_id: int):
    try:
        cards = get_user_flashcards(user_id)
        return {"flashcards": cards}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve flashcards: {str(e)}")
