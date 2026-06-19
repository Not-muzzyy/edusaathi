"""modules/rag_pipeline.py — PDF ingestion and RAG retrieval with robust error handling."""
import os
import tempfile
import logging
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

VECTOR_DIR = os.getenv("VECTOR_STORE_DIR", "./data/vector_stores")
EMBED_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_embeddings():
    """Get cached embeddings model with error handling."""
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name=EMBED_MODEL)
    except Exception as e:
        logger.error(f"Failed to load embeddings model: {e}")
        raise RuntimeError(f"Could not load embedding model: {e}")


def ingest_pdf(pdf_bytes: bytes, filename: str, user_id: int, subject: str) -> dict:
    """Parse PDF, chunk, embed, store in FAISS. Returns {store_path, chunk_count}."""
    tmp_path = None
    try:
        import pdfplumber
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        from langchain_community.vectorstores import FAISS
        from langchain_core.documents import Document

        text = ""
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        with pdfplumber.open(tmp_path) as pdf:
            for page in pdf.pages:
                try:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
                except Exception as e:
                    logger.warning(f"Could not extract page: {e}")
                    continue

        if not text.strip():
            return {
                "success": False, 
                "error": "PDF is image-based or scanned. Please try text-based PDFs or OCR them first."
            }

        splitter = RecursiveCharacterTextSplitter(chunk_size=350, chunk_overlap=80)
        chunks = splitter.split_text(text)
        
        if not chunks:
            return {"success": False, "error": "No text content found in PDF. File may be corrupted."}
        
        docs = [Document(page_content=c, metadata={"source": filename}) for c in chunks]

        embeddings = get_embeddings()
        vectorstore = FAISS.from_documents(docs, embeddings)

        os.makedirs(VECTOR_DIR, exist_ok=True)
        safe_subject = "".join(c if c.isalnum() or c in "_-" else "_" for c in subject)
        safe_filename = "".join(c if c.isalnum() or c in "_-." else "_" for c in filename[:20])
        store_path = os.path.join(VECTOR_DIR, f"{user_id}_{safe_subject}_{safe_filename}")
        vectorstore.save_local(store_path)

        return {"success": True, "store_path": store_path, "chunk_count": len(chunks)}
        
    except ImportError as e:
        logger.error(f"Missing dependency for PDF processing: {e}")
        return {"success": False, "error": f"Missing library. Contact admin: {str(e)[:50]}"}
    except Exception as e:
        logger.error(f"PDF ingestion error: {e}")
        error_msg = str(e).lower()
        if "encrypted" in error_msg or "password" in error_msg:
            return {"success": False, "error": "PDF is password-protected. Please unlock it first."}
        elif "permission" in error_msg:
            return {"success": False, "error": "Permission denied. Check file permissions."}
        else:
            return {"success": False, "error": f"Error processing PDF: {str(e)[:80]}"}
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


@lru_cache(maxsize=10)
def get_cached_faiss_store(store_path: str):
    """Load and cache FAISS vector store in memory."""
    from langchain_community.vectorstores import FAISS
    embeddings = get_embeddings()
    return FAISS.load_local(store_path, embeddings, allow_dangerous_deserialization=True)

def retrieve_context(query: str, store_path: str, top_k: int = 5) -> str:
    """Retrieve top_k relevant chunks from FAISS store with validation."""
    try:
        if not store_path or not os.path.exists(store_path):
            logger.warning(f"Vector store not found: {store_path}")
            return ""
        
        # Check if required files exist
        required_files = ["index.faiss", "index.pkl"]
        existing = os.listdir(store_path)
        if not any(f in existing for f in required_files):
            logger.warning(f"Vector store corrupted at: {store_path}")
            return ""
        
        vs = get_cached_faiss_store(store_path)
        docs = vs.similarity_search(query, k=top_k)
        
        if not docs:
            return ""
        
        return "\n\n".join([d.page_content for d in docs])
        
    except Exception as e:
        logger.error(f"Context retrieval error from {store_path}: {e}")
        return ""


def retrieve_context_from_multiple(query: str, store_paths: list, top_k: int = 5) -> str:
    """Retrieve from multiple stores and merge results."""
    all_chunks = []
    
    if not store_paths:
        return ""
    
    for sp in store_paths:
        if sp and os.path.exists(sp):
            try:
                chunk = retrieve_context(query, sp, top_k=3)
                if chunk:
                    all_chunks.append(chunk)
            except Exception as e:
                logger.warning(f"Error retrieving from {sp}: {e}")
                continue
    
    return "\n\n".join(all_chunks[:top_k]) if all_chunks else ""
