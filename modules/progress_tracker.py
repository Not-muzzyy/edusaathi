"""modules/progress_tracker.py — Analytics computations."""
from modules.auth import get_quiz_history, get_topic_progress, upsert_topic_progress
import json


def update_progress_from_result(user_id, subject, topic, score, total):
    """Compute mastery and save."""
    if total == 0:
        return
    new_score = score / total
    existing = get_topic_progress(user_id)
    old = next((r for r in existing if r["subject"] == subject and r["topic"] == topic), None)
    if old:
        mastery = round(0.7 * old["mastery_score"] + 0.3 * new_score, 3)
    else:
        mastery = round(new_score, 3)
    mastery = min(1.0, max(0.0, mastery))
    upsert_topic_progress(user_id, subject, topic, mastery)


def get_dashboard_stats(user_id) -> dict:
    history = get_quiz_history(user_id)
    progress = get_topic_progress(user_id)

    total_quizzes = len(history)
    total_score = sum(h["score"] for h in history)
    total_q = sum(h["total_questions"] for h in history)
    avg_pct = round(total_score / total_q * 100, 1) if total_q else 0

    weak_topics = [p for p in progress if p["mastery_score"] < 0.5]
    strong_topics = [p for p in progress if p["mastery_score"] >= 0.8]

    overall_mastery = 0.0
    if progress:
        overall_mastery = round(sum(p["mastery_score"] for p in progress) / len(progress) * 100, 1)

    return {
        "total_quizzes": total_quizzes,
        "avg_score_pct": avg_pct,
        "overall_mastery": overall_mastery,
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "progress": progress,
        "history": history
    }
