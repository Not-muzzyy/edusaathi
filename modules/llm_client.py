"""modules/llm_client.py — Groq API wrapper with fast response times."""
import os
import json
import re
import logging
from dotenv import load_dotenv

load_dotenv(override=True)

# Fast model for chat (8B = blazing fast on Groq, ~200ms latency)
FAST_MODEL = os.getenv("FAST_MODEL", "llama-3.1-8b-instant")
# Capable model for structured generation (MCQs, flashcards, analysis)
CHAT_MODEL = os.getenv("LLM_MODEL", "llama-3.3-70b-versatile")
logger = logging.getLogger(__name__)


class KeyRotator:
    def __init__(self):
        self.index = 0

    def get_next_key(self) -> str:
        keys = []
        for key_name in ["GROQ_API_KEY_1", "GROQ_API_KEY_2", "GROQ_API_KEY_3"]:
            val = os.getenv(key_name)
            if val and val.strip() and not val.strip().startswith("your_groq_api_key"):
                keys.append(val.strip())
        
        # Fallback
        if not keys:
            default_key = os.getenv("GROQ_API_KEY")
            if default_key and default_key.strip() and not default_key.strip().startswith("your_groq_api_key"):
                keys.append(default_key.strip())
                
        if not keys:
            raise ValueError(
                "No Groq API keys configured. Please set GROQ_API_KEY_1, GROQ_API_KEY_2, "
                "GROQ_API_KEY_3 or GROQ_API_KEY in your .env file."
            )
            
        key = keys[self.index % len(keys)]
        self.index = (self.index + 1) % len(keys)
        return key

rotator = KeyRotator()


def _client():
    """Get Groq client with rotating API keys."""
    from groq import Groq
    api_key = rotator.get_next_key()
    return Groq(api_key=api_key)


def _parse_json_response(raw: str) -> list:
    """Robust JSON parsing with multiple fallback strategies."""
    if not raw:
        return []
    
    # Clean markdown fences
    cleaned = raw.strip()
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = cleaned.strip()
    
    # Strip <think>...</think> blocks from reasoning models
    cleaned = re.sub(r'<think>[\s\S]*?</think>', '', cleaned).strip()
    
    # Try direct parse
    try:
        result = json.loads(cleaned)
        if isinstance(result, list):
            return result
        return []
    except json.JSONDecodeError:
        pass
    
    # Try to find JSON array in the response
    match = re.search(r'\[[\s\S]*\]', cleaned)
    if match:
        try:
            result = json.loads(match.group())
            if isinstance(result, list):
                return result
        except json.JSONDecodeError:
            pass
    
    # Try line by line for objects
    try:
        objects = []
        for match in re.finditer(r'\{[^{}]*\}', cleaned):
            try:
                obj = json.loads(match.group())
                objects.append(obj)
            except json.JSONDecodeError:
                continue
        if objects:
            return objects
    except Exception:
        pass
    
    return []


def chat(context: str, question: str, history: list = None) -> str:
    """Context-grounded chat answer — uses fast 8B model for speed."""
    try:
        # Trim context to keep responses fast (8B model works best with focused context)
        trimmed_context = context[:4000] if len(context) > 4000 else context
        
        system = (
            "You are EduSathi, a helpful AI study tutor. "
            "Answer clearly and concisely using ONLY the provided context. "
            "If the answer is not in the context, say: "
            "'I don't have information on that in your uploaded material.'\n\n"
            f"Context:\n{trimmed_context}"
        )
        messages = [{"role": "system", "content": system}]
        if history:
            for h in history[-4:]:  # Keep fewer history items for speed
                messages.append({"role": h["role"], "content": h["content"]})
        messages.append({"role": "user", "content": question})
        
        resp = _client().chat.completions.create(
            model=FAST_MODEL, messages=messages, temperature=0.3, max_tokens=512
        )
        
        if resp and resp.choices and resp.choices[0].message:
            content = resp.choices[0].message.content
            if content:
                return content.strip()
        
        return "I apologize, but I couldn't process that question. Please try again."
        
    except ValueError as e:
        return f"⚠️ Configuration Error: {str(e)}"
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return "I'm having trouble connecting right now. Please check your internet connection and try again."


def generate_mcqs(context: str, topic: str, n: int = 5, difficulty: str = "medium") -> list:
    """Generate MCQs using the capable model. Returns list of dicts."""
    try:
        # Trim context for faster generation
        trimmed_context = context[:6000] if len(context) > 6000 else context
        
        prompt = (
            f"Generate exactly {n} {difficulty}-difficulty multiple choice questions "
            f"about '{topic}' from this study material. "
            "Return ONLY a valid JSON array. No extra text. No markdown fences. "
            "Each element: "
            '{"question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], '
            '"answer": "A", "explanation": "..."}. '
            f"Material:\n{trimmed_context}"
        )
        
        resp = _client().chat.completions.create(
            model=CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5, max_tokens=2500
        )
        
        if not resp or not resp.choices or not resp.choices[0].message:
            return []
        
        raw = resp.choices[0].message.content
        if not raw:
            return []
        
        questions = _parse_json_response(raw)
        
        # Validate question structure
        valid_questions = []
        for q in questions:
            if isinstance(q, dict) and "question" in q and "options" in q and "answer" in q:
                if isinstance(q.get("options"), list) and len(q["options"]) >= 4:
                    q["options"] = q["options"][:4]
                    q["explanation"] = q.get("explanation", "")
                    valid_questions.append(q)
        
        return valid_questions
        
    except ValueError as e:
        logger.error(f"MCQ generation config error: {e}")
        return []
    except Exception as e:
        logger.error(f"MCQ generation error: {e}")
        return []


def generate_flashcards(context: str, n: int = 10) -> list:
    """Generate flashcards using the capable model. Returns list of {front, back}."""
    try:
        # Trim context for faster generation
        trimmed_context = context[:5000] if len(context) > 5000 else context
        
        prompt = (
            f"Generate exactly {n} flashcards from this study material. "
            "Return ONLY a valid JSON array. No markdown fences. No extra text. "
            'Each element: {"front": "term or question", "back": "definition or answer"}. '
            f"Material:\n{trimmed_context}"
        )
        
        resp = _client().chat.completions.create(
            model=CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4, max_tokens=2000
        )
        
        if not resp or not resp.choices or not resp.choices[0].message:
            return []
        
        raw = resp.choices[0].message.content
        if not raw:
            return []
        
        cards = _parse_json_response(raw)
        
        # Validate flashcard structure
        valid_cards = []
        for card in cards:
            if isinstance(card, dict) and "front" in card and "back" in card:
                valid_cards.append({
                    "front": str(card["front"]),
                    "back": str(card["back"])
                })
        
        return valid_cards
        
    except ValueError as e:
        logger.error(f"Flashcard generation config error: {e}")
        return []
    except Exception as e:
        logger.error(f"Flashcard generation error: {e}")
        return []


def explain_wrong_answer(question: str, selected: str, correct: str) -> str:
    """Explain why an answer is wrong — uses fast model for speed."""
    try:
        prompt = (
            f"The student answered '{selected}' to: '{question}'. "
            f"The correct answer is '{correct}'. "
            "Explain in 2-3 encouraging sentences why the correct answer is right "
            "and what concept the student should review."
        )
        
        resp = _client().chat.completions.create(
            model=FAST_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3, max_tokens=200
        )
        
        if resp and resp.choices and resp.choices[0].message:
            content = resp.choices[0].message.content
            if content:
                return content.strip()
        
        return "Review this concept in your study material for better understanding."
        
    except Exception as e:
        logger.error(f"Explanation error: {e}")
        return "Review this concept in your study material for better understanding."


def analyze_question_paper(text: str, n: int = 10) -> list:
    """Analyze question paper to identify frequently asked topics."""
    try:
        # Trim to reasonable size for fast processing
        max_chars = 8000
        paper_text = text[:max_chars] if len(text) > max_chars else text
        
        prompt = (
            f"Analyze these exam questions and identify the top {n} most frequently appearing topics.\n\n"
            "Return ONLY a valid JSON array. No markdown fences. No extra text.\n"
            'Each element: {"topic": "Topic Name", "frequency": 3, "importance": "high", '
            '"subtopics": ["A", "B"], "question_types": ["short answer", "essay"]}.\n\n'
            "Importance: high (3+ questions), medium (2), low (1).\n\n"
            f"Paper:\n{paper_text}"
        )
        
        resp = _client().chat.completions.create(
            model=CHAT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2, max_tokens=2000
        )
        
        if not resp or not resp.choices or not resp.choices[0].message:
            return []
        
        raw = resp.choices[0].message.content
        if not raw:
            return []
        
        topics = _parse_json_response(raw)
        
        # Validate and normalize topic structure
        valid_topics = []
        for t in topics:
            if isinstance(t, dict) and "topic" in t:
                valid_topics.append({
                    "topic": str(t.get("topic", "")),
                    "frequency": int(t.get("frequency", 1)),
                    "importance": str(t.get("importance", "medium")),
                    "subtopics": t.get("subtopics", []),
                    "question_types": t.get("question_types", [])
                })
        
        # Sort by frequency descending
        valid_topics.sort(key=lambda x: x["frequency"], reverse=True)
        
        return valid_topics[:n]
        
    except Exception as e:
        logger.error(f"Paper analysis error: {e}")
        return []
