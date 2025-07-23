@echo off
echo Starting Personal Finance Manager...
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"
cd ..

echo Waiting for backend to start...
timeout /t 3 >nul

echo Starting Frontend Development Server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo Both servers are starting up!
echo Frontend: http://0.0.0.0:5173
echo Backend:  http://0.0.0.0:3003
echo.
echo Press any key to close this window...
pause >nul
