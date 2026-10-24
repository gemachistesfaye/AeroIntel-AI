@echo off
echo ========================================================
echo Starting AeroIntel AI - Aviation Intelligence Platform
echo ========================================================

echo [1/2] Starting Python Flask Backend on port 8000...
start "AeroIntel Backend" cmd /k "cd backend && call .venv\Scripts\activate.bat && python run.py"

timeout /t 2 /nobreak > nul

echo [2/2] Starting React Vite Frontend on port 5173...
start "AeroIntel Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Platform launched:
echo - Frontend UI: http://localhost:5173
echo - Backend API: http://127.0.0.1:8000/api/health
echo ========================================================
pause
