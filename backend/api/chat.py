from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from modules.rag_pipeline import ingest_pdf
from modules.llm_client import chat, analyze_question_paper
from modules.auth import save_document_record, get_user_documents, save_chat_message, get_chat_history
from modules.validation import safe_retrieve_context
from typing import List, Optional
import pdfplumber
import io

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatHistoryItem(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    user_id: int
    question: str
    store_paths: List[str]
    history: Optional[List[ChatHistoryItem]] = []

@router.post("/upload")
async def upload_document(
    user_id: int = Form(...),
    subject: str = Form(...),
    file: UploadFile = File(...)
):
    # Validate file format
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        contents = await file.read()
        res = ingest_pdf(contents, file.filename, user_id, subject)
        if not res["success"]:
            raise HTTPException(status_code=400, detail=res["error"])
        
        doc_id = save_document_record(user_id, file.filename, subject, res["store_path"])
        return {
            "message": "Document uploaded and indexed successfully.",
            "doc_id": doc_id,
            "filename": file.filename,
            "subject": subject,
            "store_path": res["store_path"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.post("/query")
def query_tutor(req: ChatRequest):
    try:
        # Convert Pydantic history items to standard dicts
        history_list = [{"role": h.role, "content": h.content} for h in req.history] if req.history else []
        
        # Retrieve context from multiple FAISS vector stores safely
        context = safe_retrieve_context(req.store_paths, req.question, top_k=6)
        
        # Invoke LLM chat response
        response_text = chat(context, req.question, history_list)
        
        # Save chat messages to database for persistence
        save_chat_message(req.user_id, "user", req.question)
        save_chat_message(req.user_id, "assistant", response_text)
        
        return {"response": response_text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI query failed: {str(e)}")

@router.get("/history/{user_id}")
def get_history(user_id: int):
    try:
        history = get_chat_history(user_id)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chat history: {str(e)}")

@router.get("/documents/{user_id}")
def get_documents(user_id: int):
    try:
        docs = get_user_documents(user_id)
        return {"documents": docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch documents: {str(e)}")

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
