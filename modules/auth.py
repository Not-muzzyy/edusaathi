"""modules/auth.py — Authentication helpers."""
import sqlite3, bcrypt, os
from dotenv import load_dotenv
load_dotenv()

DB_PATH = os.getenv("DB_PATH", "./data/users.db")


def get_conn():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_conn()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'student',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS uploaded_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            filename TEXT,
            subject_tag TEXT,
            vector_store_path TEXT,
            upload_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            subject TEXT,
            topic TEXT,
            score INTEGER,
            total_questions INTEGER,
            difficulty_level TEXT,
            answers_json TEXT,
            attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS topic_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            subject TEXT,
            topic TEXT,
            mastery_score REAL DEFAULT 0.0,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS flashcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            document_id INTEGER REFERENCES uploaded_documents(id),
            front TEXT,
            back TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
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
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_quiz_user ON quiz_attempts(user_id, subject);
        CREATE INDEX IF NOT EXISTS idx_progress_user ON topic_progress(user_id);
        CREATE INDEX IF NOT EXISTS idx_study_tasks_date ON study_tasks(date);
        
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id),
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_chat_history_user ON chat_history(user_id);
    """)
    conn.commit()
    conn.close()


def register_user(name: str, email: str, password: str, role: str = "student") -> dict:
    if len(password) < 8:
        return {"success": False, "error": "Password must be at least 8 characters."}
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
    try:
        conn = get_conn()
        conn.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (name, email, hashed, role)
        )
        conn.commit()
        conn.close()
        return {"success": True}
    except sqlite3.IntegrityError:
        return {"success": False, "error": "Email already registered."}


def login_user(email: str, password: str) -> dict:
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if not row:
        return {"success": False, "error": "Email not found."}
    if bcrypt.checkpw(password.encode(), row["password_hash"].encode()):
        return {"success": True, "user": dict(row)}
    return {"success": False, "error": "Incorrect password."}


def get_all_users():
    conn = get_conn()
    rows = conn.execute("SELECT id, name, email, role, created_at FROM users").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def update_user_role(user_id: int, role: str):
    conn = get_conn()
    conn.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
    conn.commit()
    conn.close()


def delete_user(user_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()


def save_document_record(user_id, filename, subject_tag, vector_store_path) -> int:
    conn = get_conn()
    cur = conn.execute(
        "INSERT INTO uploaded_documents (user_id, filename, subject_tag, vector_store_path) VALUES (?, ?, ?, ?)",
        (user_id, filename, subject_tag, vector_store_path)
    )
    doc_id = cur.lastrowid
    conn.commit()
    conn.close()
    return doc_id


def get_user_documents(user_id):
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM uploaded_documents WHERE user_id = ? ORDER BY upload_timestamp DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_quiz_attempt(user_id, subject, topic, score, total, difficulty, answers_json):
    conn = get_conn()
    conn.execute(
        "INSERT INTO quiz_attempts (user_id, subject, topic, score, total_questions, difficulty_level, answers_json) VALUES (?,?,?,?,?,?,?)",
        (user_id, subject, topic, score, total, difficulty, answers_json)
    )
    conn.commit()
    conn.close()


def get_quiz_history(user_id):
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM quiz_attempts WHERE user_id = ? ORDER BY attempted_at DESC LIMIT 50",
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def upsert_topic_progress(user_id, subject, topic, mastery_score):
    conn = get_conn()
    existing = conn.execute(
        "SELECT id FROM topic_progress WHERE user_id = ? AND subject = ? AND topic = ?",
        (user_id, subject, topic)
    ).fetchone()
    if existing:
        conn.execute(
            "UPDATE topic_progress SET mastery_score = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ?",
            (mastery_score, existing["id"])
        )
    else:
        conn.execute(
            "INSERT INTO topic_progress (user_id, subject, topic, mastery_score) VALUES (?,?,?,?)",
            (user_id, subject, topic, mastery_score)
        )
    conn.commit()
    conn.close()


def get_topic_progress(user_id):
    conn = get_conn()
    rows = conn.execute(
        "SELECT subject, topic, mastery_score, last_updated FROM topic_progress WHERE user_id = ?",
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_flashcards(user_id, document_id, cards: list):
    conn = get_conn()
    for card in cards:
        conn.execute(
            "INSERT INTO flashcards (user_id, document_id, front, back) VALUES (?,?,?,?)",
            (user_id, document_id, card.get("front", ""), card.get("back", ""))
        )
    conn.commit()
    conn.close()


def get_user_flashcards(user_id):
    conn = get_conn()
    rows = conn.execute(
        "SELECT f.*, d.filename FROM flashcards f LEFT JOIN uploaded_documents d ON f.document_id = d.id WHERE f.user_id = ? ORDER BY f.created_at DESC",
        (user_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_quiz_attempts():
    conn = get_conn()
    rows = conn.execute(
        "SELECT qa.*, u.name, u.email FROM quiz_attempts qa JOIN users u ON qa.user_id = u.id ORDER BY attempted_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def save_chat_message(user_id: int, role: str, content: str):
    conn = get_conn()
    conn.execute(
        "INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)",
        (user_id, role, content)
    )
    conn.commit()
    conn.close()


def get_chat_history(user_id: int, limit: int = 50) -> list:
    conn = get_conn()
    rows = conn.execute(
        "SELECT role, content FROM chat_history WHERE user_id = ? ORDER BY created_at ASC LIMIT ?",
        (user_id, limit)
    ).fetchall()
    conn.close()
    return [{"role": r["role"], "content": r["content"]} for r in rows]
