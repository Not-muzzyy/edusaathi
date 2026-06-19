from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from modules.auth import init_db

# Initialize SQLite database
init_db()

app = FastAPI(title="EduSathi API", version="2.0.0")

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "app": "edusathi-api"}

from backend.api.auth import router as auth_router
app.include_router(auth_router)

from backend.api.chat import router as chat_router
app.include_router(chat_router)

from backend.api.quiz import router as quiz_router
app.include_router(quiz_router)

from backend.api.flashcards import router as flashcards_router
app.include_router(flashcards_router)

from backend.api.analytics import router as analytics_router
app.include_router(analytics_router)

from backend.api.planner import router as planner_router
app.include_router(planner_router)



# Mount frontend static files in production if dist directory exists
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
