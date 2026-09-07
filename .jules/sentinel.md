## 2026-09-05 - [Role Downgrade Vulnerability]
**Vulnerability:** The Google OAuth login logic (`backend/api/auth.py`) forcefully downgraded all existing users back to the 'student' role upon each login attempt, irrespective of their assigned roles (e.g., admin, faculty).
**Learning:** This implies any administrative access granted inside the application is systematically wiped out when a user re-authenticates. It's a critical logic flaw related to session management/authentication flow that acts as a denial of service (DoS) for admin functionality.
**Prevention:** During OAuth flows, only default role assignment should happen on *user creation*. Existing records should simply have their authentication validated and sessions updated without overwriting crucial authorization metadata.
