# EduSathi Advanced UI/UX Features Specification

Date: 2026-06-08
Topic: Interactive RAG Citations, Streak Gamification, and VSKUB Syllabus Heatmap

---

## 1. Goal & Background
To transition the redesigned EduSathi platform from a functional portal into an exceptionally premium, high-engagement academic companion. We are adding three interactive frontend components designed to work in synergy with our existing FastAPI endpoints:
1. **Interactive RAG Citations & Inline PDF Viewer:** Connecting chatbot responses directly to document sources.
2. **Weekly Study Streak & Gamification Badges:** Incentivizing student review habits through visual feedback.
3. **VSKUB Syllabus Mastery Heatmap:** Providing students with a clean visual overview of their syllabus coverage and exam readiness.

---

## 2. Feature Details & Interface Mockup Contract

### 2.1 Interactive RAG Citations & Inline PDF Viewer
- **Behavior:**
  - When the FastAPI chat endpoint returns a response, any inline citations (e.g. `[Ref 1]`, `[Ref 2]`) will be parsed on the client side and rendered as interactive `.ref-tag` component anchors.
  - Clicking a `.ref-tag` split-opens a sidebar document panel (or scrolls/highlights the segment if the viewer is already open).
  - The referenced text block within the document view transitions to active highlighting (`bg-amber-500/20` with a solid amber left border) using an expo-out ease-curve.
- **Client Components:**
  - `ChatCitations` parser helper.
  - `ReferenceViewer` side-panel.

### 2.2 Study Streak & Gamification Badges
- **Behavior:**
  - A widget embedded in the student dashboard reads the user's past quiz history from `/api/quiz/history` to calculate daily streaks.
  - Visualized as a custom pulsing fire SVG indicator (using `will-change: transform` and `scale3d` animations).
  - Integrates an XP progress bar showing progress toward the next mastery milestone.
  - Includes circular badges representing unlockable achievements (e.g., "RAG Scholar", "Exam Master").
- **Client Components:**
  - `StreakWidget` card.
  - `AchievementBadge` tooltip icons.

### 2.3 VSKUB Syllabus Mastery Heatmap
- **Behavior:**
  - A contribution-style grid representing syllabus chapters and units (BCA/MCA syllabus segments).
  - Individual nodes color-code to represent mastery scores fetched from `/api/analytics/dashboard` (Teal for high mastery, Violet for medium, Dark Grey/Transparent for unattempted).
  - Hovering over a node displays a glassmorphic tooltip with the unit name and detailed mastery percentage.
  - Provides a critical warning label and action recommendations (e.g. "Take Unit 5 Quiz next") for chapters with low mastery.
- **Client Components:**
  - `MasteryHeatmap` grid.
  - `HeatmapNode` interactive tooltip component.

---

## 3. Data Integration & Endpoint Contracts

The features will utilize the existing FastAPI routers without requiring database schema changes, mapping directly to client endpoints:
1. **RAG Citations:** Matches retrieved FAISS source paths returned in the query response.
2. **Study Streaks:** Evaluates `attempted_at` timestamps from `/api/analytics/dashboard` (history logs).
3. **Syllabus Heatmap:** Binds to `topic_progress` mastery scores (`mastery_score` fields in `/api/analytics/dashboard`).

---

## 4. Aesthetic Consistency & Micro-Animations
- All components will leverage the **Violet Glassmorphism** system.
- Card containers will use `glass-panel` backdrop filters and slate borders.
- Hover states will use hardware-accelerated transitions (Composite layers only) to maintain a locked 60FPS refresh rate on the client.

---

## 5. Verification Plan
- **Mock Integration Verification:** Build and run `npm run build` inside `frontend/` to confirm that the new components compile with zero lint/TypeScript warnings.
- **Interactive Verification:**
  - Select citations in mock chat, verify side-panels open, and correct lines are highlighted.
  - Complete a mock quiz, verify that the dashboard streak count increments, and the heatmap color changes immediately.
