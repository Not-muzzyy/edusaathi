from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from modules.auth import (
    get_all_users, update_user_role, delete_user,
    get_all_quiz_attempts, save_document_record
)
from modules.rag_pipeline import ingest_pdf
from modules.llm_client import analyze_question_paper
import pdfplumber
import io

router = APIRouter(prefix="/api/admin", tags=["admin"])

class UpdateRoleRequest(BaseModel):
    user_id: int
    role: str

@router.get("/users")
def list_users():
    try:
        users = get_all_users()
        # Do not return hashed passwords
        for u in users:
            if "password_hash" in u:
                del u["password_hash"]
        return {"users": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@router.post("/role")
def change_role(req: UpdateRoleRequest):
    if req.role not in ["student", "faculty", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")
    try:
        update_user_role(req.user_id, req.role)
        return {"message": "User role updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update role: {str(e)}")

@router.delete("/user/{user_id}")
def remove_user(user_id: int):
    try:
        delete_user(user_id)
        return {"message": "User deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")

@router.get("/quiz-attempts")
def get_quiz_attempts():
    try:
        attempts = get_all_quiz_attempts()
        return {"attempts": attempts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch attempts: {str(e)}")

@router.post("/upload-paper")
async def upload_question_paper(
    user_id: int = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    try:
        contents = await file.read()
        res = ingest_pdf(contents, file.filename, user_id, subject)
        if not res["success"]:
            raise HTTPException(status_code=400, detail=res["error"])
        
        doc_id = save_document_record(user_id, file.filename, subject, res["store_path"])
        return {
            "message": "Question paper uploaded and indexed successfully.",
            "doc_id": doc_id,
            "chunk_count": res["chunk_count"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Paper upload failed: {str(e)}")

@router.post("/analyze-paper")
async def analyze_paper(
    n_topics: int = Form(10),
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    try:
        contents = await file.read()
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            text = "".join([p.extract_text() or "" for p in pdf.pages])
            
        if not text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the PDF paper.")
            
        topics = analyze_question_paper(text, n=n_topics)
        return {"topics": topics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Topic extraction failed: {str(e)}")
