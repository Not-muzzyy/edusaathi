# AI Smart Study Planner & Adaptive Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an interactive visual month grid calendar for EduSathi that automatically schedules syllabus-based daily study tasks and practice quizzes leading up to a target exam date, and is fully mobile-responsive and integrated with the onboarding tour.

**Architecture:** Create an SQLite database schema for study plans and tasks, set up a FastAPI backend routing engine, design an interactive monthly CSS Grid Calendar view on the frontend that collapses to a simple agenda list on mobile, and extend the onboarding tour to guide new users through the planner tab.

**Tech Stack:** FastAPI (Python), SQLite (SQL), React (TypeScript), Tailwind CSS/Vanilla CSS, Lucide React (SVGs).

---

### Task 1: Database Setup
Modify the SQLite initialization script to define `study_plans` and `study_tasks` tables.

**Files:**
- Modify: `modules/auth.py`

- [ ] **Step 1: Edit modules/auth.py to add table queries**
  Update `init_db()` in [auth.py](file:///c:/Users/vizxe/Downloads/edusathi-main/edusathi-main/modules/auth.py#L16-65) to include the new schemas.
  
  ```python
  # Insert into the executescript block:
  CREATE TABLE IF NOT EXISTS study_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      course TEXT,
      sem TEXT,
      target_exam_date TEXT NOT NULL,
      daily_time_limit INTEGER DEFAULT 60,
      intensity_tier TEXT DEFAULT 'balanced',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS study_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER REFERENCES study_plans(id),
      date TEXT NOT NULL,
      title TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      estimated_minutes INTEGER DEFAULT 30,
      completed INTEGER DEFAULT 0,
      completed_at DATETIME DEFAULT NULL
  );
  
  CREATE INDEX IF NOT EXISTS idx_study_tasks_date ON study_tasks(date);
  ```

- [ ] **Step 2: Commit database schema setup**
  Commit the database modifications.

---

### Task 2: Backend API Router
Create a new FastAPI router file for planner operations.

**Files:**
- Create: `backend/api/planner.py`

- [ ] **Step 1: Write backend/api/planner.py**
  Create [planner.py](file:///c:/Users/vizxe/Downloads/edusathi-main/edusathi-main/backend/api/planner.py) containing endpoints for setting up the plan, fetching tasks, toggling completion, and rescheduling.
  
  ```python
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
  ```

- [ ] **Step 2: Commit backend/api/planner.py**
  Commit the newly created API router.

---

### Task 3: Backend API Integration
Mount the planner router in the main FastAPI application entry point.

**Files:**
- Modify: `backend/main.py`

- [ ] **Step 1: Include planner router in backend/main.py**
  Import and mount the router in [main.py](file:///c:/Users/vizxe/Downloads/edusathi-main/edusathi-main/backend/main.py).
  
  ```python
  # Insert around line 39:
  from backend.api.planner import router as planner_router
  app.include_router(planner_router)
  ```

- [ ] **Step 2: Commit main.py integrations**
  Commit the router inclusion changes.

---

### Task 4: Frontend Component Design
Create the responsive visual grid monthly calendar component `StudyPlanner` in `App.tsx`.

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Write StudyPlanner component inside App.tsx**
  Add the complete component definition inside [App.tsx](file:///c:/Users/vizxe/Downloads/edusathi-main/edusathi-main/frontend/src/App.tsx) around line 883.
  
  ```typescript
  interface StudyPlannerProps {
    user: User;
    showToast: any;
    setTab: (t: string) => void;
  }
  
  interface StudyTask {
    id: number;
    plan_id: number;
    date: string;
    title: string;
    activity_type: string;
    estimated_minutes: number;
    completed: number;
  }
  
  interface StudyPlan {
    id: number;
    user_id: number;
    course: string;
    sem: string;
    target_exam_date: string;
    daily_time_limit: number;
    intensity_tier: string;
  }
  
  function StudyPlanner({ user, showToast, setTab }: StudyPlannerProps) {
    const [plan, setPlan] = useState<StudyPlan | null>(null)
    const [tasks, setTasks] = useState<StudyTask[]>([])
    const [examDate, setExamDate] = useState('')
    const [dailyLimit, setDailyLimit] = useState(60)
    const [intensity, setIntensity] = useState('balanced')
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()) // 0-indexed
    const [rescheduling, setRescheduling] = useState(false)
  
    const fetchPlannerData = async () => {
      try {
        const res = await fetch(`/api/planner/tasks?user_id=${user.id}`)
        if (res.ok) {
          const data = await res.json()
          setPlan(data.plan)
          setTasks(data.tasks)
          if (data.plan) {
            setExamDate(data.plan.target_exam_date)
            setDailyLimit(data.plan.daily_time_limit)
            setIntensity(data.plan.intensity_tier)
          }
        }
      } catch (err) {
        showToast('Connection error fetching planner.', 'error')
      }
    }
  
    useEffect(() => {
      fetchPlannerData()
    }, [user.id])
  
    const handleSetup = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!examDate) {
        showToast('Please specify a target exam date.', 'error')
        return
      }
      try {
        const res = await fetch('/api/planner/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            course: localStorage.getItem('edusathi_course') || 'General',
            sem: localStorage.getItem('edusathi_sem') || '1st Semester',
            target_exam_date: examDate,
            daily_time_limit: dailyLimit,
            intensity_tier: intensity
          })
        })
        if (res.ok) {
          showToast('Study schedule generated successfully!', 'success')
          fetchPlannerData()
        } else {
          showToast('Failed to generate study schedule.', 'error')
        }
      } catch (err) {
        showToast('Network error during setup.', 'error')
      }
    }
  
    const toggleTask = async (taskId: number) => {
      try {
        const res = await fetch(`/api/planner/tasks/${taskId}/toggle`, { method: 'POST' })
        if (res.ok) {
          setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: t.completed === 1 ? 0 : 1 } : t))
          showToast('Task updated!', 'success')
        }
      } catch (err) {
        showToast('Failed to update task.', 'error')
      }
    }
  
    const triggerReschedule = async () => {
      setRescheduling(true)
      try {
        const res = await fetch(`/api/planner/reschedule?user_id=${user.id}`, { method: 'POST' })
        if (res.ok) {
          const data = await res.json()
          showToast(`Successfully rescheduled ${data.shifted_count} past task(s) to today!`, 'success')
          fetchPlannerData()
        }
      } catch (e) {
        showToast('Failed to reschedule tasks.', 'error')
      } finally {
        setRescheduling(false)
      }
    }
  
    // Calendar math helpers
    const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
    const firstDayIndex = (y: number, m: number) => new Date(y, m, 1).getDay()
    const totalDays = daysInMonth(currentYear, currentMonth)
    const startOffset = firstDayIndex(currentYear, currentMonth)
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  
    const nextMonth = () => {
      if (currentMonth === 11) {
        setCurrentMonth(0)
        setCurrentYear(currentYear + 1)
      } else {
        setCurrentMonth(currentMonth + 1)
      }
    }
  
    const prevMonth = () => {
      if (currentMonth === 0) {
        setCurrentMonth(11)
        setCurrentYear(currentYear - 1)
      } else {
        setCurrentMonth(currentMonth - 1)
      }
    }
  
    const getTasksForDay = (dayNum: number) => {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      return tasks.filter(t => t.date === dateStr)
    }
  
    return (
      <div className="flex flex-col gap-8 flex-1 max-w-6xl mx-auto w-full">
        <div>
          <h1 className="font-header font-extrabold text-3xl text-slate-100 tracking-tight flex items-center gap-3">
            <span className="p-2 bg-violetAccent/10 rounded-xl border border-violetAccent/30 text-violetAccent">
              <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            AI Smart Study Planner
          </h1>
          <p className="text-slate-400 text-sm mt-1">Countdown calendar mapped directly to your upcoming exam dates and textbook topics.</p>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Setup Study Plan */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-6 h-fit relative overflow-hidden laser-border-container">
            <div className="laser-border-line"></div>
            <h3 className="font-header font-bold text-lg text-slate-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-tealAccent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Planner Settings
            </h3>
  
            <form onSubmit={handleSetup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-header">Exam Target Date</label>
                <input 
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-200 transition-colors w-full"
                  required
                />
              </div>
  
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-header">Workload intensity</label>
                <select 
                  value={intensity}
                  onChange={e => {
                    setIntensity(e.target.value)
                    if (e.target.value === 'chill') setDailyLimit(30)
                    else if (e.target.value === 'balanced') setDailyLimit(60)
                    else if (e.target.value === 'crunch') setDailyLimit(120)
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-200 transition-colors cursor-pointer w-full"
                >
                  <option value="chill">Chill Mode (30m / day)</option>
                  <option value="balanced">Balanced Mode (60m / day)</option>
                  <option value="crunch">Crunch Mode (120m / day)</option>
                  <option value="custom">Custom Duration...</option>
                </select>
              </div>
  
              {intensity === 'custom' && (
                <div className="flex flex-col gap-1.5 animate-scaleUp">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-header">Custom Daily Budget (Minutes)</label>
                  <input 
                    type="number"
                    min="10"
                    max="480"
                    value={dailyLimit}
                    onChange={e => setDailyLimit(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violetAccent text-slate-200 transition-colors w-full"
                    required
                  />
                </div>
              )}
  
              <button 
                type="submit" 
                className="w-full glow-btn shimmer-button text-white font-bold py-3.5 rounded-xl font-header shadow-lg hover:shadow-violetAccent/20 text-sm mt-2 transition-all"
              >
                Generate Study Schedule
              </button>
            </form>
  
            {plan && (
              <>
                <div className="h-px bg-slate-800/80 my-1"></div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={triggerReschedule}
                    disabled={rescheduling}
                    className="w-full text-xs bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <svg className={`w-4 h-4 text-tealAccent ${rescheduling ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3 3L22 4" />
                    </svg>
                    Reschedule Incomplete Tasks
                  </button>
                </div>
              </>
            )}
          </div>
  
          {/* Right Column: Month Calendar Grid or Mobile Agenda Checklist */}
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col gap-6">
            {!plan ? (
              <div className="flex flex-col items-center justify-center text-center p-12 gap-3 min-h-[300px]">
                <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-full text-slate-500">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-header font-bold text-lg text-slate-300 mt-2">No Active Study Plan</h3>
                <p className="text-slate-500 text-xs max-w-sm">Configure your next exam target date in the left panel to populate your study calendar.</p>
              </div>
            ) : (
              <>
                {/* Desktop View: Full Grid Calendar */}
                <div className="hidden md:flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-header font-bold text-xl text-slate-200">
                      {monthNames[currentMonth]} {currentYear}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button onClick={prevMonth} className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={nextMonth} className="p-2 border border-slate-800 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
  
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 tracking-wider uppercase mb-2">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                  </div>
  
                  <div className="grid grid-cols-7 gap-2 flex-1">
                    {/* Fill padding offset cells */}
                    {Array.from({ length: startOffset }).map((_, idx) => (
                      <div key={`offset-${idx}`} className="bg-slate-950/20 border border-transparent rounded-lg min-h-[90px] opacity-20"></div>
                    ))}
                    
                    {/* Month cells */}
                    {Array.from({ length: totalDays }).map((_, idx) => {
                      const dayNum = idx + 1
                      const dayTasks = getTasksForDay(dayNum)
                      const isToday = new Date().getDate() === dayNum && new Date().getMonth() === currentMonth && new Date().getFullYear() === currentYear
                      
                      return (
                        <div 
                          key={`day-${dayNum}`} 
                          className={`min-h-[95px] p-2 rounded-xl border flex flex-col gap-1 transition-all ${
                            isToday 
                              ? 'bg-violetAccent/5 border-violetAccent shadow-[0_0_10px_rgba(108,99,255,0.15)]' 
                              : 'bg-slate-900/30 border-slate-800/80 hover:border-slate-700/60'
                          }`}
                        >
                          <span className={`text-xs font-bold ${isToday ? 'text-violetAccent' : 'text-slate-500'}`}>
                            {dayNum} {isToday && <span className="text-[9px] font-semibold opacity-85 ml-0.5">(Today)</span>}
                          </span>
                          
                          <div className="flex flex-col gap-1 overflow-y-auto max-h-[70px] mt-1 pr-0.5">
                            {dayTasks.map(t => (
                              <button 
                                key={t.id}
                                onClick={() => toggleTask(t.id)}
                                className={`w-full text-left text-[9px] font-semibold p-1.5 rounded transition-all cursor-pointer flex items-center justify-between gap-1 select-none ${
                                  t.completed === 1 
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 line-through' 
                                    : t.activity_type === 'quiz' 
                                      ? 'bg-tealAccent/10 text-tealAccent border border-tealAccent/20 hover:bg-tealAccent/20' 
                                      : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20'
                                }`}
                              >
                                <span className="truncate">{t.title}</span>
                                {t.completed === 1 && (
                                  <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
  
                {/* Mobile View: Collapses to Agenda Feed list */}
                <div className="flex md:hidden flex-col gap-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <h3 className="font-header font-bold text-lg text-slate-200">Daily Agenda Tasks</h3>
                    <span className="text-xs text-tealAccent font-bold bg-tealAccent/5 px-3 py-1 rounded-full border border-tealAccent/20 font-header">
                      {tasks.filter(t => t.completed === 1).length} / {tasks.length} Completed
                    </span>
                  </div>
  
                  <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {tasks.map(t => {
                      const taskDate = new Date(t.date + 'T00:00:00')
                      const dateLabel = taskDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      return (
                        <div 
                          key={t.id}
                          onClick={() => toggleTask(t.id)}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer select-none ${
                            t.completed === 1 
                              ? 'bg-emerald-950/10 border-emerald-900/50 text-slate-500' 
                              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col gap-1 min-w-0">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{dateLabel}</span>
                            <span className={`text-sm font-semibold text-slate-200 truncate ${t.completed === 1 ? 'line-through text-slate-500' : ''}`}>
                              {t.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">Estimated: {t.estimated_minutes} min</span>
                          </div>
  
                          <div className="shrink-0">
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                              t.completed === 1 
                                ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                                : 'border-slate-700 hover:border-slate-600'
                            }`}>
                              {t.completed === 1 && (
                                <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Commit StudyPlanner component**
  Commit the newly added StudyPlanner component file edits.

---

### Task 5: Frontend Integration
Link the new tab option to navigation and sidebars.

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Import Calendar icon**
  Ensure Lucide React icon `Calendar` is imported in `App.tsx` on line 7.
  
  ```typescript
  // Replace line 6 with:
  XCircle, FileSpreadsheet, FileText, ChevronRight, Calendar
  ```

- [ ] **Step 2: Add sidebar navigation button for Study Planner**
  Insert the tab link button inside [App.tsx](file:///c:/Users/vizxe/Downloads/edusathi-main/edusathi-main/frontend/src/App.tsx#L325-340).
  
  ```typescript
  // Add right after activeTab === 'progress' nav button:
  <NavButton 
    id="nav-planner"
    active={activeTab === 'planner'} 
    onClick={() => { setActiveTab('planner'); setSidebarOpen(false); }} 
    icon={<Calendar />} 
    label="Study Planner" 
  />
  ```

- [ ] **Step 3: Route the StudyPlanner view**
  Mount the component wrapper inside `App.tsx` under the main layout router.
  
  ```typescript
  // Add inside the main route routing block:
  {activeTab === 'planner' && (
    <StudyPlanner user={user} showToast={showToast} setTab={setActiveTab} />
  )}
  ```

- [ ] **Step 4: Commit integration changes**
  Commit the navigation and routing integrations.

---

### Task 6: Onboarding Guide Walkthrough Tour Update
Update the onboarding step coordinates array to include Step 3 highlighting the Study Planner.

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Insert new step inside TOUR_STEPS**
  Insert the step definition in [App.tsx](file:///c:/Users/vizxe/Downloads/edusathi-main/edusathi-main/frontend/src/App.tsx#L565-595).
  
  ```typescript
  // Insert inside TOUR_STEPS array right after Step 2 (Workspace Navigation):
  {
    target: '#nav-planner',
    title: 'AI Study Planner',
    content: 'Click here to set your next exam date and preferred study intensity. The AI will immediately map out daily study cards and practice tests on your calendar.',
    placement: 'right',
    icon: <Calendar className="w-5 h-5 text-tealAccent" />
  },
  ```

- [ ] **Step 2: Commit onboarding modifications**
  Commit the tour modifications.

---

### Task 7: Build & Verification
Build the application to test TS compiler rules and perform browser verification.

**Files:**
- None (Build verification only)

- [ ] **Step 1: Run production build compiler check**
  Run: `npm run build` inside `frontend/` CWD.
  Expected: Successful exit code with zero errors.

- [ ] **Step 2: Verify desktop layout, mobile viewports, and onboarding tour**
  Confirm setup date selection, calendar grid cell populating, toggling tasks, and correct overlay position during onboarding guide.
