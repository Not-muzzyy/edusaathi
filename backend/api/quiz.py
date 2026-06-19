from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from modules.llm_client import generate_mcqs
from modules.auth import save_quiz_attempt, get_quiz_history
from modules.progress_tracker import update_progress_from_result
from modules.validation import safe_retrieve_context
from typing import List, Optional
import json

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

class GenerateQuizRequest(BaseModel):
    subject: str
    topic: str
    difficulty: str = "medium"
    n_questions: int = 5
    store_paths: List[str] = []

class QuizHistoryItem(BaseModel):
    question: str
    selected: str
    correct: bool
    explanation: str
    correct_answer: str

class SubmitQuizRequest(BaseModel):
    user_id: int
    subject: str
    topic: str
    score: int
    total: int
    difficulty: str
    history: List[QuizHistoryItem]

@router.post("/generate")
def generate_quiz(req: GenerateQuizRequest):
    try:
        if req.store_paths:
            # Safely retrieve context from documents using FAISS
            context = safe_retrieve_context(req.store_paths, req.topic, top_k=6)
        else:
            # Fallback to topic/subject details if no docs uploaded
            context = f"Topic: {req.topic}. Subject: {req.subject}. Generate high-quality university questions."
            
        questions = generate_mcqs(context, req.topic, n=req.n_questions, difficulty=req.difficulty)
        
        if not questions:
            raise HTTPException(status_code=500, detail="Could not generate questions. Please try again.")
            
        return {"questions": questions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@router.post("/submit")
def submit_quiz(req: SubmitQuizRequest):
    try:
        # Convert quiz items to dict list for sqlite JSON serialization
        history_list = [{
            "question": h.question,
            "selected": h.selected,
            "correct": h.correct,
            "explanation": h.explanation,
            "correct_answer": h.correct_answer
        } for h in req.history]
        
        # Save the attempt record in SQLite
        save_quiz_attempt(
            req.user_id,
            req.subject,
            req.topic,
            req.score,
            req.total,
            req.difficulty,
            json.dumps(history_list)
        )
        
        # Update topic progress mastery
        update_progress_from_result(req.user_id, req.subject, req.topic, req.score, req.total)
        
        return {"message": "Quiz attempt submitted and progress updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Submission failed: {str(e)}")

@router.get("/history/{user_id}")
def get_history(user_id: int):
    try:
        history = get_quiz_history(user_id)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch quiz history: {str(e)}")
