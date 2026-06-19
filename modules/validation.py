"""
Validation and security utilities for EduSathi.
Handles input sanitization, vector store validation, and error handling.
"""
import os
import re
from pathlib import Path
from typing import Optional, Tuple


def validate_vector_store(store_path: str) -> Tuple[bool, str]:
    """
    Validate that vector store path exists and is accessible.
    Returns: (is_valid, error_message)
    """
    if not store_path:
        return False, "Vector store path is empty"
    
    if not os.path.exists(store_path):
        return False, f"Vector store not found at {store_path}. Document may be corrupted."
    
    # Check if it's a directory (FAISS stores as folders)
    if not os.path.isdir(store_path):
        return False, "Vector store path is not a directory"
    
    # Check for required FAISS index files
    required_files = ["index.faiss", "index.pkl"]
    existing_files = os.listdir(store_path)
    
    if not any(f in existing_files for f in required_files):
        return False, "Vector store is corrupted or incomplete"
    
    return True, ""


def safe_retrieve_context(store_paths: list[str], query: str, top_k: int = 6) -> str:
    """
    Safely retrieve context from multiple vector stores with validation.
    Returns empty string if all stores fail (graceful degradation).
    """
    from modules.rag_pipeline import retrieve_context_from_multiple
    
    # Validate all paths first
    valid_paths = []
    for path in store_paths:
        is_valid, error_msg = validate_vector_store(path)
        if is_valid:
            valid_paths.append(path)
        # Silently skip invalid paths
    
    if not valid_paths:
        return ""  # No valid stores, will use general context
    
    try:
        context = retrieve_context_from_multiple(query, valid_paths, top_k=top_k)
        return context if context else ""
    except Exception as e:
        # Log error but don't crash
        print(f"Error retrieving context: {str(e)}")
        return ""


def validate_mcq_structure(question: dict) -> Tuple[bool, str]:
    """
    Validate MCQ structure from LLM.
    Returns: (is_valid, error_message)
    """
    if not isinstance(question, dict):
        return False, "Question must be a dictionary"
    
    # Check required fields
    required_fields = ["question", "options", "answer", "explanation"]
    for field in required_fields:
        if field not in question:
            return False, f"Missing field: {field}"
    
    # Validate question
    if not isinstance(question["question"], str) or not question["question"].strip():
        return False, "Question text is empty"
    
    # Validate options
    if not isinstance(question["options"], list) or len(question["options"]) != 4:
        return False, f"Expected 4 options, got {len(question.get('options', []))}"
    
    # Check options format (should be "A. Text", "B. Text", etc.)
    for i, opt in enumerate(question["options"]):
        if not isinstance(opt, str) or not opt.strip():
            return False, f"Option {i+1} is empty"
        # Accept both "A. Text" and just text formats
        if not re.match(r'([A-D]\.\s+)?.*', opt):
            return False, f"Invalid option format: {opt}"
    
    # Validate answer
    answer = str(question.get("answer", "")).strip().upper()
    if not re.match(r'^[A-D]', answer):
        return False, f"Answer must be A-D, got: {answer}"
    
    # Validate explanation
    if not isinstance(question["explanation"], str) or not question["explanation"].strip():
        return False, "Explanation is empty"
    
    return True, ""


def sanitize_mcq(question: dict) -> dict:
    """
    Clean and standardize MCQ format from LLM.
    Ensures consistent structure.
    """
    # Normalize answer to just letter
    answer = str(question.get("answer", "")).strip().upper()
    answer = re.match(r'[A-D]', answer).group(0) if re.match(r'[A-D]', answer) else "A"
    
    # Clean options to "A. Text" format if needed
    options = []
    for i, opt in enumerate(question.get("options", [])):
        opt_text = str(opt).strip()
        # Remove existing letter prefix if present
        opt_text = re.sub(r'^[A-D]\.\s+', '', opt_text)
        # Add proper prefix
        letter = chr(65 + i)  # A, B, C, D
        options.append(f"{letter}. {opt_text}")
    
    return {
        "question": question.get("question", "").strip(),
        "options": options[:4] if len(options) >= 4 else options + ["Option"] * (4 - len(options)),
        "answer": answer,
        "explanation": question.get("explanation", "").strip()
    }


def validate_pdf_file(file_size_bytes: int, file_name: str) -> Tuple[bool, str]:
    """
    Validate PDF file before processing.
    Returns: (is_valid, error_message)
    """
    max_size = 50 * 1024 * 1024  # 50 MB
    
    if file_size_bytes > max_size:
        size_mb = file_size_bytes / (1024 * 1024)
        return False, f"File too large ({size_mb:.1f}MB). Max 50MB allowed."
    
    if not file_name.lower().endswith('.pdf'):
        return False, "Only PDF files are supported"
    
    if file_size_bytes < 1024:  # Less than 1KB
        return False, "File is empty or corrupted"
    
    return True, ""


def get_user_input_error_message(error: Exception) -> str:
    """
    Convert exception to user-friendly error message.
    """
    error_str = str(error).lower()
    
    if "timeout" in error_str:
        return "Request timed out. Please try again."
    elif "rate limit" in error_str:
        return "API rate limit exceeded. Please wait a moment and try again."
    elif "api" in error_str or "groq" in error_str:
        return "API error. Check your API key or try again later."
    elif "permission" in error_str:
        return "Permission denied. Check file access rights."
    elif "memory" in error_str:
        return "Insufficient memory. Try with fewer documents or a shorter topic."
    else:
        return f"Error: {error_str[:100]}"
