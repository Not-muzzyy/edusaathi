# EduSathi UI Redesign Specification
Date: 2026-06-08
Topic: Streamlit UI Migration to React + FastAPI Unified Monorepo

## 1. Goal & Background
The current EduSathi platform (AI-powered study companion) is built using Streamlit. While functional, Streamlit's unified runtime architecture creates significant bottlenecks for premium UI designs, page-transition speeds, micro-animations, and responsive layouts. 
This specification outlines the complete redesign and migration of the EduSathi frontend to a modern, lightweight Single Page Application (SPA) built using React + Vite, while refactoring the Python codebase into a robust FastAPI backend.

---

## 2. Technology Stack & Directory Layout
We will adopt a **Unified Monorepo (Approach 1)**, which encapsulates the entire application under a single repository structure. In production, FastAPI serves the compiled React production build as static files.

### Folder Structure:
```
edusathi-main/
├── backend/                       # Python FastAPI codebase
│   ├── main.py                    # Server entrypoint and static file configuration
│   ├── api/                       # API router endpoints
│   │   ├── auth.py                # Login, registration, profile setup
│   │   ├── chat.py                # RAG tutor chat pipeline
│   │   ├── quiz.py                # Adaptive MCQ quiz sessions
│   │   ├── flashcards.py          # Flashcard endpoints
│   │   ├── analytics.py           # Dashboard stats, mastery, and PDF report exports
│   │   ├── admin.py               # User control & question paper uploads/analysis
│   │   └── faculty.py             # Student analytics list
│   ├── modules/                   # Existing business logic (rag_pipeline, auth database)
│   └── data/                      # SQLite DB (users.db) & FAISS vector stores
│
├── frontend/                      # React SPA UI
│   ├── src/
│   │   ├── components/            # Sidebar, GlassCard, MathRenderer, LoadingSpinner
│   │   ├── context/               # AuthContext, ThemeContext, SessionContext
│   │   ├── pages/                 # Dashboard, ChatTutor, QuizMode, ExamSim, Flashcards
│   │   └── App.tsx                # Client routing and shell layout
│   ├── package.json               # Tailwind, Lucide React, Framer Motion
│   ├── tailwind.config.js         # Theme color values & font setup
│   └── vite.config.ts             # API reverse proxy setup
```

---

## 3. Design & Aesthetic System
The interface will be redesigned from the ground up to offer a sleek, high-fidelity experience that is simple and intuitive for both technical and non-technical users.

### Visual Spec:
* **Theme System:** Premium Dark Mode (Violet Glassmorphism).
  * **Backdrop Color:** Deep Indigo-Black (`#040408`)
  * **Card Styles:** Semi-transparent panels (`rgba(255, 255, 255, 0.02)`) with thin borders (`rgba(255, 255, 255, 0.08)`), subtle backdrop filter blurs (`backdrop-filter: blur(16px)`), and radial hover glows.
  * **Accent Color 1:** Electric Neon Violet (`#6C63FF`)
  * **Accent Color 2:** Cyber Turquoise Teal (`#4ECDC4`)
* **Typography Pairing (Sleek Geometric):**
  * **Headers (Upright Sans):** *Plus Jakarta Sans* (Bold/Extrabold, straight alignment, no italics, letter-spacing: `-0.2px`).
  * **Body Copy (Crisp UI Sans):** *Inter* (Regular/Medium). Highly readable for study texts and chat dialogues.
* **Graphic Elements:**
  * **Lucide React vector SVGs** replace all basic emojis.
  * SVG icons will execute springy scale scaling (`transform: scale3d(1.15, 1.15, 1)`) and border glow alterations on hover.
* **Transitions & Animations:**
  * **FPS Lock:** Powered strictly by GPU-accelerated CSS properties (`transform`, `translate3d`, `opacity`) to guarantee 60FPS fluid motion.
  * **Ease Curves:** Natural expo deceleration (`cubic-bezier(0.16, 1, 0.3, 1)`) and spring bounce keyframes (`cubic-bezier(0.34, 1.56, 0.64, 1)`).

---

## 4. API Endpoint Contract
The FastAPI server will expose the following REST API endpoints, reading/writing to the existing SQLite `data/users.db` and FAISS vector stores.

### Authentication & Profiles:
* `POST /api/auth/register` — Create new user (Student / Faculty / Admin).
* `POST /api/auth/login` — Session sign-in, returns user dict.
* `POST /api/auth/profile` — Update BCA / BBA / MCA course and semester details.

### AI RAG Chat Tutor:
* `POST /api/chat/query` — Submits student question, performs FAISS similarity retrieval over document indices, runs Groq LLaMA-3.3 LLM, returns tutor response.
* `GET /api/chat/documents` — Lists student's uploaded document records.

### Quizzes & Exams:
* `POST /api/quiz/generate` — Generate custom difficulty MCQs from study materials.
* `POST /api/quiz/submit` — Submit selected answers, records attempt in `quiz_attempts`, updates topic mastery score.
* `GET /api/quiz/history` — Retrives history of past 50 quiz attempts.

### Flashcards:
* `POST /api/flashcards/generate` — Ingests vector document index chunks, returns LLM generated Q&A flashcard array, records to SQLite.
* `GET /api/flashcards` — Returns list of created flashcards for user.

### Analytics:
* `GET /api/analytics/dashboard` — Calculates average scores, weak topics, strong topics, and overall mastery percentage.
* `GET /api/analytics/export-pdf` — Streams PDF report compiled via `ReportLab` wrapper.

### Administration & Faculty:
* `GET /api/admin/users` & `POST /api/admin/role` — User lists and role updates.
* `POST /api/admin/upload-paper` — Uploads and analyzes past papers.
* `GET /api/faculty/student-attempts` — Lists student attempts filtered by course.

---

## 5. Verification & Testing Plan
* **API Validation:** Interactive Swagger documentation (`/docs` endpoint) to test and verify all REST endpoints in isolation.
* **Component Testing:** Hot-reload Vite dev-server testing.
* **Performance Check:** Verify hardware-accelerated animations run at 60fps on mobile/desktop browsers without lag.
