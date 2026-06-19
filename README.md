<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/FastAPI-0.110+-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/LLM-Groq_LLaMA_3.3-6C63FF?style=for-the-badge&logo=meta&logoColor=white" />
  <img src="https://img.shields.io/badge/RAG-FAISS+LangChain-4ECDC4?style=for-the-badge" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" />
</p>

<h1 align="center">🎓 EduSathi</h1>
<h3 align="center">AI-Powered Study Companion for VSKUB Students</h3>

<p align="center">
  <strong>⚠️ This project is under active development — features may change, break, or be incomplete.</strong>
</p>

<p align="center">
  A full-stack educational platform that uses <strong>RAG (Retrieval-Augmented Generation)</strong> and <strong>LLMs</strong> to help students learn from their own study materials — with AI tutoring, adaptive quizzes, exam simulations, flashcards, an AI study planner, and progress tracking.
</p>

---

## ✨ Features

### 🎒 Student Portal
| Feature | Description |
|---------|-------------|
| **AI Chat Tutor** | Ask questions from your uploaded PDFs — answers grounded in your study material |
| **Quiz Arena** | AI-generated MCQs with adaptive difficulty based on your performance |
| **Exam Room** | Timed mock exams with countdown timer and instant scoring |
| **Flashcards** | Auto-generated flashcards from your notes for quick revision |
| **AI Study Planner** | Set exam dates and let AI map out daily study cards on a calendar |
| **Paper Analysis** | AI-powered topic extraction from past question papers |
| **Progress Analytics** | Track quizzes, scores, topic mastery with visual charts |
| **Dashboard** | Personalized overview with metrics, score trends, and quick actions |

### 👨‍🏫 Faculty Portal
| Feature | Description |
|---------|-------------|
| **Student Analytics** | View all quiz attempts, filter by subject, monitor performance |

### ⚙️ Admin Portal
| Feature | Description |
|---------|-------------|
| **User Management** | View, search, promote/demote roles, delete accounts |
| **Question Paper Upload** | Ingest past papers into the RAG knowledge base |

### 🔒 Role-Based Access Control
- **Students** — Access to all learning tools
- **Faculty** — Student analytics and performance monitoring
- **Admin** — Full access including user management and paper uploads

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend API** | FastAPI + Uvicorn |
| **LLM** | Groq API → LLaMA 3.3 70B Versatile |
| **RAG Pipeline** | LangChain + FAISS vector store + Sentence Transformers |
| **Embeddings** | `all-MiniLM-L6-v2` (384-dim) |
| **Database** | SQLite (users, quiz attempts, documents, progress) |
| **Auth** | bcrypt password hashing + Google OAuth |
| **PDF Processing** | pdfplumber + PyPDF2 |
| **Reports** | ReportLab PDF generation |

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+** and npm
- A free [Groq API Key](https://console.groq.com/keys)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/edusathi.git
cd edusathi
```

### 2. Set Up the Backend

```bash
# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env    # macOS/Linux
copy .env.example .env  # Windows
```

Edit `.env` and add your keys:

```env
GROQ_API_KEY=gsk_your_groq_api_key_here
DB_PATH=./data/users.db
VECTOR_STORE_DIR=./data/vector_stores
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
LLM_MODEL=llama-3.3-70b-versatile
SECRET_KEY=change_this_to_a_random_secret
APP_ENV=production
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### 4. Set Up the Frontend

```bash
cd frontend
npm install
cd ..
```

### 5. Run the App (Development)

You need **two terminals** running simultaneously:

**Terminal 1 — Backend API (FastAPI):**
```bash
uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 — Frontend Dev Server (Vite):**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

> The Vite dev server automatically proxies `/api` requests to the FastAPI backend on port 8000.

---

## 🏭 Production Build

To build the frontend for production:

```bash
cd frontend
npm run build
```

This creates a `frontend/dist/` folder. The FastAPI server automatically serves these static files when the dist directory exists — so you only need to run:

```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

---

## 📁 Project Structure

```
edusathi/
├── .env.example                # Environment variable template
├── .gitignore
├── requirements.txt            # Python dependencies
├── LICENSE
├── README.md
│
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   └── api/
│       ├── auth.py             # Login, register, Google OAuth endpoints
│       ├── chat.py             # Chat tutor + document upload endpoints
│       ├── quiz.py             # Quiz generation + submission endpoints
│       ├── flashcards.py       # Flashcard generation endpoints
│       ├── analytics.py        # Dashboard stats + report endpoints
│       ├── planner.py          # AI study planner endpoints
│       └── admin.py            # Admin user/document management
│
├── modules/                    # Shared business logic (used by backend)
│   ├── auth.py                 # DB operations, user management
│   ├── llm_client.py           # Groq LLM wrapper (chat, MCQ gen, analysis)
│   ├── rag_pipeline.py         # PDF ingestion + FAISS vector retrieval
│   ├── quiz_engine.py          # Quiz session management
│   ├── flashcard_generator.py  # LLM-powered flashcard creation
│   ├── progress_tracker.py     # Score tracking + mastery calculation
│   ├── report_generator.py     # PDF report generation
│   └── validation.py           # Input sanitization + security validators
│
├── frontend/
│   ├── package.json
│   ├── vite.config.ts          # Vite config with API proxy
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── main.tsx            # React entry point
│       ├── App.tsx             # Full SPA — all pages and components
│       └── index.css           # Global styles + design system
│
└── data/
    └── .gitkeep                # Auto-created: users.db, vector_stores/
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | ✅ | Your Groq API key for LLM access |
| `VITE_GOOGLE_CLIENT_ID` | ❌ | Google OAuth client ID for sign-in |
| `DB_PATH` | ❌ | SQLite database path (default: `./data/users.db`) |
| `VECTOR_STORE_DIR` | ❌ | FAISS vector store directory (default: `./data/vector_stores`) |
| `EMBEDDING_MODEL` | ❌ | Sentence transformer model (default: `all-MiniLM-L6-v2`) |
| `LLM_MODEL` | ❌ | Groq model name (default: `llama-3.3-70b-versatile`) |
| `SECRET_KEY` | ❌ | App secret for session security |
| `APP_ENV` | ❌ | `development` or `production` |

---

## 👤 Test Accounts

After first run, register new accounts through the app. To test role-based access:

1. **Register** a new account (defaults to `student` role)
2. To create an **admin** or **faculty** account, update the role in the database:

```bash
sqlite3 data/users.db
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
.quit
```

---

## 🛠️ Troubleshooting

<details>
<summary><b>App shows "GROQ_API_KEY not configured"</b></summary>

Make sure your `.env` file exists in the project root and contains a valid key:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
```
Get a free key at [console.groq.com/keys](https://console.groq.com/keys)
</details>

<details>
<summary><b>Frontend can't connect to the backend</b></summary>

Make sure the FastAPI server is running on port 8000:
```bash
uvicorn backend.main:app --reload --port 8000
```
The Vite dev server proxies `/api` requests to `localhost:8000` automatically.
</details>

<details>
<summary><b>ModuleNotFoundError on import</b></summary>

Ensure you activated your virtual environment and installed dependencies:
```bash
venv\Scripts\activate   # Windows
pip install -r requirements.txt
```
</details>

<details>
<summary><b>PDF upload fails or returns empty results</b></summary>

- Ensure the PDF has selectable text (not scanned images)
- Check file size is under 50MB
- Verify your Groq API key is valid and has remaining quota
</details>

---

## 🤝 Contributing

EduSathi is under active development and **contributions are welcome!**

### How to Contribute

1. **Fork** this repository
2. **Create** a feature branch: `git checkout -b feature/your-feature-name`
3. **Commit** your changes: `git commit -m "Add: your feature description"`
4. **Push** to your fork: `git push origin feature/your-feature-name`
5. **Open a Pull Request** with a clear description of what you changed and why

### Ideas for Contributions
- 🐛 Bug fixes and error handling improvements
- 🎨 UI/UX enhancements and accessibility improvements
- 📱 Mobile responsiveness tweaks
- 🧪 Adding tests (unit tests, integration tests)
- 📝 Documentation improvements
- 🌐 Internationalization / localization support
- ⚡ Performance optimizations
- 🔧 New features (check Issues for ideas)

> Please open an issue first if you plan a large change — so we can discuss the approach before you invest time.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for VSKUB Students
</p>
