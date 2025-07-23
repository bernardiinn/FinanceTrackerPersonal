#!/bin/bash

echo "Starting Finance Tracker for VM Environment"
echo "========================================="
echo ""
echo "Frontend: http://0.0.0.0:4173"
echo "Backend:  http://0.0.0.0:3003"
echo ""

# Start backend in background
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Go back to main directory and start frontend
cd ..
echo "Starting frontend development server..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Both servers are running:"
echo "Frontend: http://0.0.0.0:4173"
echo "Backend API: http://0.0.0.0:3003/api/health"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT

# Wait for processes
wait
