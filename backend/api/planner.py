from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from modules.auth import get_conn
from datetime import datetime, timedelta
import json

router = APIRouter(prefix="/api/planner", tags=["planner"])

class PlannerSetupReq(BaseModel):
    user_id: int
    course: str
    sem: str
    target_exam_date: str
    daily_time_limit: int
    intensity_tier: str

@router.post("/setup")
def setup_planner(req: PlannerSetupReq):
    conn = get_conn()
    cursor = conn.cursor()
    try:
        # Delete existing plan and tasks for this user
        cursor.execute("SELECT id FROM study_plans WHERE user_id = ?", (req.user_id,))
        old_plan = cursor.fetchone()
        if old_plan:
            cursor.execute("DELETE FROM study_tasks WHERE plan_id = ?", (old_plan[0],))
            cursor.execute("DELETE FROM study_plans WHERE id = ?", (old_plan[0],))

        # Insert new plan
        cursor.execute(
            "INSERT INTO study_plans (user_id, course, sem, target_exam_date, daily_time_limit, intensity_tier) VALUES (?, ?, ?, ?, ?, ?)",
            (req.user_id, req.course, req.sem, req.target_exam_date, req.daily_time_limit, req.intensity_tier)
        )
        plan_id = cursor.lastrowid

        # Simple scheduling algorithm: distribute topics from today until exam date
        start_date = datetime.now().date()
        try:
            end_date = datetime.strptime(req.target_exam_date, "%Y-%m-%d").date()
        except Exception:
            end_date = start_date + timedelta(days=14)

        days_diff = (end_date - start_date).days
        if days_diff <= 0:
            days_diff = 7
            end_date = start_date + timedelta(days=7)

        # Fetch syllabus tags or topics
        cursor.execute("SELECT DISTINCT subject_tag FROM uploaded_documents WHERE user_id = ?", (req.user_id,))
        subjects = [row[0] for row in cursor.fetchall() if row[0]]
        if not subjects:
            subjects = ["General Aptitude", "Core Fundamentals", "Revision Topics"]

        # Prioritize low mastery topics
        cursor.execute("SELECT topic, mastery_score FROM topic_progress WHERE user_id = ? ORDER BY mastery_score ASC", (req.user_id,))
        low_mastery_topics = [row[0] for row in cursor.fetchall() if row[1] < 0.5]

        all_topics = low_mastery_topics + subjects
        topic_idx = 0

        # Generate study tasks day-by-day
        current = start_date
        while current <= end_date:
            date_str = current.strftime("%Y-%m-%d")
            topic = all_topics[topic_idx % len(all_topics)]
            topic_idx += 1

            # Divide budget (e.g. 60 min -> 30 min reading, 30 min quiz)
            half_budget = max(15, req.daily_time_limit // 2)

            # Task 1: Reading study session
            cursor.execute(
                "INSERT INTO study_tasks (plan_id, date, title, activity_type, estimated_minutes) VALUES (?, ?, ?, ?, ?)",
                (plan_id, date_str, f"Study {topic} Notes & Slides", "read", half_budget)
            )
            # Task 2: Adaptive practice quiz
            cursor.execute(
                "INSERT INTO study_tasks (plan_id, date, title, activity_type, estimated_minutes) VALUES (?, ?, ?, ?, ?)",
                (plan_id, date_str, f"Attempt {topic} MCQs", "quiz", half_budget)
            )

            current += timedelta(days=1)

        conn.commit()
        return {"status": "success", "message": f"Planner calendar populated for {days_diff} days."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/tasks")
def get_tasks(user_id: int):
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM study_plans WHERE user_id = ?", (user_id,))
        plan = cursor.fetchone()
        if not plan:
            return {"plan": None, "tasks": []}
        plan_id = plan[0]

        cursor.execute("SELECT * FROM study_plans WHERE id = ?", (plan_id,))
        plan_data = dict(cursor.fetchone())

        cursor.execute("SELECT * FROM study_tasks WHERE plan_id = ? ORDER BY date ASC", (plan_id,))
        tasks_data = [dict(row) for row in cursor.fetchall()]
        
        return {"plan": plan_data, "tasks": tasks_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/tasks/{task_id}/toggle")
def toggle_task(task_id: int):
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT completed FROM study_tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Task not found")
        new_state = 1 if row[0] == 0 else 0
        comp_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S") if new_state == 1 else None
        
        cursor.execute(
            "UPDATE study_tasks SET completed = ?, completed_at = ? WHERE id = ?",
            (new_state, comp_at, task_id)
        )
        conn.commit()
        return {"status": "success", "completed": new_state}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/reschedule")
def reschedule_tasks(user_id: int):
    conn = get_conn()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM study_plans WHERE user_id = ?", (user_id,))
        plan = cursor.fetchone()
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        plan_id = plan[0]
        
        today_str = datetime.now().date().strftime("%Y-%m-%d")
        
        # Find past incomplete tasks
        cursor.execute(
            "SELECT id FROM study_tasks WHERE plan_id = ? AND date < ? AND completed = 0",
            (plan_id, today_str)
        )
        past_incompletes = [r[0] for r in cursor.fetchall()]
        
        # Shift all past incomplete tasks to today's date
        for tid in past_incompletes:
            cursor.execute(
                "UPDATE study_tasks SET date = ? WHERE id = ?",
                (today_str, tid)
            )
        conn.commit()
        return {"status": "success", "shifted_count": len(past_incompletes)}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
