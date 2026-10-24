# AeroIntel AI - Local Development Startup Script
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "Starting AeroIntel AI - Aviation Intelligence Platform" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Start Backend
Write-Host "[1/2] Starting Python Flask Backend on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; & .\.venv\Scripts\python.exe run.py"

Start-Sleep -Seconds 2

# 2. Start Frontend
Write-Host "[2/2] Starting React Vite Frontend on port 5173..." -ForegroundColor Yellow
$npmCmd = if (Get-Command npm.cmd -ErrorAction SilentlyContinue) { "npm.cmd" } else { "C:\Program Files\nodejs\npm.cmd" }
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; & '$npmCmd' run dev"

Write-Host "`nPlatform running:" -ForegroundColor Green
Write-Host "- Frontend UI: http://localhost:5173" -ForegroundColor Green
Write-Host "- Backend API: http://127.0.0.1:8000/api/health" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
