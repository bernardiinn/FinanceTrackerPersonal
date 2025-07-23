@echo off
echo Starting Finance Tracker for VM Environment
echo =========================================
echo.
echo Frontend: http://0.0.0.0:4173
echo Backend:  http://0.0.0.0:3003
echo.

echo Starting backend server...
start "Backend Server" cmd /k "cd /d backend && npm run dev"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo Starting frontend development server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting...
echo Frontend will be available at: http://0.0.0.0:4173
echo Backend API available at: http://0.0.0.0:3003/api/health
echo.
pause
