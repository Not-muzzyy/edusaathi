"""modules/quiz_engine.py — Quiz session state management."""
import re


class QuizSession:
    def __init__(self, questions: list, topic: str = "", subject: str = ""):
        self.questions = questions
        self.topic = topic
        self.subject = subject
        self.index = 0
        self.score = 0
        self.difficulty = "medium"
        self.history = []
        self.finished = False

    def current_question(self):
        if self.index < len(self.questions):
            return self.questions[self.index]
        return None

    def submit_answer(self, selected: str) -> dict:
        q = self.current_question()
        if not q:
            return {}
        
        correct_letter = str(q.get("answer", "A")).strip().upper()
        
        # Robust parsing: extract first letter (A-D) from selected text
        # Handles both "A" and "A. Option text" formats
        if selected:
            match = re.search(r'[A-D]', selected.upper())
            selected_letter = match.group(0) if match else ""
        else:
            selected_letter = ""
        
        correct = selected_letter == correct_letter if selected_letter else False
        
        if correct:
            self.score += 1
        
        result = {
            "correct": correct,
            "explanation": q.get("explanation", ""),
            "correct_answer": correct_letter,
            "selected": selected
        }
        
        self.history.append({
            "question": q.get("question", ""),
            "selected": selected,
            "correct": correct,
            "explanation": q.get("explanation", ""),
            "correct_answer": correct_letter
        })
        
        self.index += 1
        self._adapt_difficulty()
        if self.index >= len(self.questions):
            self.finished = True
        return result

    def _adapt_difficulty(self):
        if len(self.history) < 3:
            return
        recent = self.history[-3:]
        accuracy = sum(1 for r in recent if r["correct"]) / 3.0
        if accuracy >= 0.8:
            self.difficulty = "hard"
        elif accuracy <= 0.4:
            self.difficulty = "easy"
        else:
            self.difficulty = "medium"

    def get_result(self) -> dict:
        total = len(self.questions)
        pct = round(self.score / total * 100, 1) if total else 0
        return {
            "score": self.score,
            "total": total,
            "percentage": pct,
            "difficulty": self.difficulty,
            "history": self.history
        }

    def progress_pct(self) -> float:
        total = len(self.questions)
        if total == 0:
            return 0.0
        return self.index / total
