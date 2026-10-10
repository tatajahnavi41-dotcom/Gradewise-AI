@echo off
echo ========================================================
echo   Starting CampusIQ Full-Stack Application
echo ========================================================

echo [1/2] Starting Python FastAPI Backend on port 8000...
start "CampusIQ Backend (FastAPI)" cmd /k "cd backend && python run.py"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Vite Frontend on port 5173...
start "CampusIQ Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo ========================================================
echo   CampusIQ is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/api/docs
echo ========================================================
pause
