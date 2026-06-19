# Spec: AI Smart Study Planner & Adaptive Calendar Design

This document details the architectural and visual layout design for the AI Smart Study Planner & Adaptive Calendar feature in EduSathi.

## 1. Database Schema

### `study_plans` Table
Stores the user's primary configuration.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `user_id` (INTEGER, FOREIGN KEY TO users(id))
- `course` (TEXT)
- `sem` (TEXT)
- `target_exam_date` (TEXT - Date string YYYY-MM-DD)
- `daily_time_limit` (INTEGER - budget in minutes)
- `intensity_tier` (TEXT - 'chill', 'balanced', 'crunch', 'custom')
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### `study_tasks` Table
Stores daily scheduled study blocks on the calendar grid.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `plan_id` (INTEGER, FOREIGN KEY TO study_plans(id))
- `date` (TEXT - Date string YYYY-MM-DD)
- `title` (TEXT - study action)
- `activity_type` (TEXT - 'read', 'quiz', 'flashcard', 'exam')
- `estimated_minutes` (INTEGER - duration)
- `completed` (INTEGER - 0/1)
- `completed_at` (DATETIME DEFAULT NULL)

---

## 2. Backend API Route Configuration (`backend/api/planner.py`)

- **`POST /api/planner/setup`**: Saves target exam parameters and runs the scheduler:
  - Finds all PDF documents currently ingested for the user's course and semester.
  - Distributes chapters, quizzes, and mock sessions day-by-day leading up to the target exam date.
  - Prioritizes topics with lower mastery scores based on `topic_progress` tables.
- **`GET /api/planner/tasks`**: Returns all generated task items for the active study plan.
- **`POST /api/planner/tasks/{task_id}/toggle`**: Toggles completion state.
- **`POST /api/planner/reschedule`**: Moves any past incomplete tasks forward to today.

---

## 3. Frontend Layout & User Interface

A new navigation tab `activeTab === 'planner'` will be added to the sidebar navigation menu in [App.tsx](file:///c:/Users/vizxe/Downloads/edusathi-main/edusathi-main/frontend/src/App.tsx).

### Study Planner Workspace (`StudyPlanner` component)
- **Left Column / Top Panel (Setup Box)**:
  - Input for Target Exam Date.
  - Input/Select for study budget (Intensity Tiers: "Chill" = 30m, "Balanced" = 60m, "Crunch" = 120m, or "Custom" numeric input).
- **Right Column / Main Panel (Interactive Calendar Grid)**:
  - Displays a monthly calendar grid.
  - Uses CSS grid layout with columns for days of the week (`grid-cols-7`).
  - Active cells contain interactive task badges (e.g. `📖 Study Networks`, `⚡ Practice Quiz`).
  - Clicking a badge opens the corresponding activity workspace (e.g., links directly to Chat Tutor or Quiz Arena).

### Mobile Responsiveness
- On mobile viewports (`@media (max-w: 768px)`):
  - The calendar collapses from a full monthly grid layout into a clean, vertical chronological agenda list of cards (collapsible by day) to fit single-column layouts comfortably.
  - Large interaction targets ensure easy tapping.

---

## 4. Onboarding Guide Walkthrough Update
We will insert a new onboarding step for the study planner at Step 3:
- **Target Element**: `#nav-planner` (Sidebar button).
- **Title**: `"AI Study Planner"`
- **Content**: `"Use the Study Planner to set your next exam date and preferred daily study limit. The AI will build a personalized calendar of daily task cards customized to your syllabus and mastery metrics."`
- **Icon**: Lucide SVG `<Calendar className="w-5 h-5 text-tealAccent" />` (No emojis).

---

## 5. Verification Plan

- **Automated Compile**:
  - Run `npm run build` inside `frontend/` to check for TypeScript type safety.
- **Manual Verification**:
  - Open the planner settings in the browser.
  - Set a date, click setup, and confirm calendar tasks generate.
  - Check mobile emulator view to confirm the grid collapses to the vertical agenda checklist layout.
  - Restart the Welcome Tour and verify the new Step 3 spotlight renders correctly over the `#nav-planner` sidebar element.
