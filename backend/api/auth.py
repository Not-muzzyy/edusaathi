from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from modules.auth import login_user, register_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str = "student"

@router.post("/register")
def register(req: RegisterRequest):
    raise HTTPException(status_code=400, detail="Local registration is disabled. Please Sign In with Google.")

@router.post("/login")
def login(req: LoginRequest):
    raise HTTPException(status_code=400, detail="Local login is disabled. Please Sign In with Google.")


class GoogleLoginRequest(BaseModel):
    credential: str
    is_access_token: bool = False


@router.post("/google-login")
def google_login(req: GoogleLoginRequest):
    import urllib.request
    import json
    import os
    
    token = req.credential
    if not token:
        raise HTTPException(status_code=400, detail="Missing credential token")

    # Securely validate the token via Google's tokeninfo/userinfo API
    try:
        if req.is_access_token:
            url = f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}"
        else:
            url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            
        req_obj = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req_obj) as response:
            status = response.getcode()
            response_body = response.read().decode('utf-8')
            
        if status != 200:
            raise HTTPException(status_code=400, detail="Failed to verify Google token")
            
        token_info = json.loads(response_body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Google token validation error: {str(e)}")

    # Verify basic token claims
    email = token_info.get("email")
    email_verified = token_info.get("email_verified")
    name = token_info.get("name", "Google User")
    
    if not email:
        raise HTTPException(status_code=400, detail="Google token does not contain email")
        
    if isinstance(email_verified, str):
        email_verified = (email_verified.lower() == 'true')
    elif email_verified is None:
        email_verified = True
        
    if not email_verified:
        raise HTTPException(status_code=400, detail="Google email is not verified")

    # Connect to SQLite database to find or insert user
    from modules.auth import get_conn
    conn = get_conn()
    try:
        # Check if user already exists
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        if row:
            user_data = dict(row)
            if user_data.get("role") != "student":
                conn.execute("UPDATE users SET role = 'student' WHERE id = ?", (user_data["id"],))
                conn.commit()
                user_data["role"] = "student"
        else:
            # Create a new user with Google details
            import bcrypt
            dummy_password = os.urandom(24).hex()
            hashed = bcrypt.hashpw(dummy_password.encode(), bcrypt.gensalt(12)).decode()
            
            cursor = conn.execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                (name, email, hashed, "student")
            )
            conn.commit()
            new_id = cursor.lastrowid
            
            # Fetch the newly created user row
            new_row = conn.execute("SELECT * FROM users WHERE id = ?", (new_id,)).fetchone()
            user_data = dict(new_row)
            
        if "password_hash" in user_data:
            del user_data["password_hash"]
            
        return {"user": user_data, "is_new_user": not row}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error during Google login: {str(e)}")
    finally:
        conn.close()
