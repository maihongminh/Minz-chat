#!/bin/bash

# Script để start cả backend và frontend cùng lúc

echo "🚀 Starting Discord Chat Application..."
echo ""

# Check if running in tmux or screen
if [ -z "$TMUX" ] && [ -z "$STY" ]; then
    echo "⚠️  Warning: Not running in tmux or screen"
    echo "   The application will stop when you close the terminal"
    echo "   Recommend: Install tmux (sudo apt install tmux) and run: tmux"
    echo ""
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if ports are already in use
if check_port 8000; then
    echo "❌ Port 8000 is already in use (Backend)"
    echo "   Kill process with: lsof -ti:8000 | xargs kill -9"
    exit 1
fi

if check_port 3000; then
    echo "❌ Port 3000 is already in use (Frontend)"
    echo "   Kill process with: lsof -ti:3000 | xargs kill -9"
    exit 1
fi

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "📁 Project directory: $DIR"
echo ""

# Start Backend
echo "🔧 Starting Backend..."
cd "$DIR/backend"

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "   Run: python3 -m venv venv"
    exit 1
fi

# Activate venv and start backend in background
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
echo "   Logs: $DIR/backend/backend.log"

# Wait a bit for backend to start
sleep 3

# Check if backend started successfully
if check_port 8000; then
    echo "✅ Backend started successfully on http://localhost:8000"
else
    echo "❌ Backend failed to start! Check backend.log"
    exit 1
fi

echo ""

# Start Frontend
echo "🎨 Starting Frontend..."
cd "$DIR/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found!"
    echo "   Run: npm install"
    exit 1
fi

# Start frontend in background
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
echo "   Logs: $DIR/frontend/frontend.log"

# Wait for frontend to start
sleep 5

# Check if frontend started successfully
if check_port 3000; then
    echo "✅ Frontend started successfully on http://localhost:3000"
else
    echo "❌ Frontend failed to start! Check frontend.log"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Application is running!"
echo ""
echo "📍 URLs:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📝 Process IDs:"
echo "   Backend:  $BACKEND_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "⚠️  To stop the application, run:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo "   or run: ./STOP.sh"
echo ""
echo "📋 Save these PIDs to stop later:"
echo "$BACKEND_PID" > "$DIR/.backend.pid"
echo "$FRONTEND_PID" > "$DIR/.frontend.pid"
echo ""
echo "Press Ctrl+C to stop (will kill both processes)"

# Trap Ctrl+C to kill both processes
trap "echo ''; echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped!'; exit 0" INT

# Keep script running
echo "Monitoring processes..."
while true; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "❌ Backend process died!"
        kill $FRONTEND_PID 2>/dev/null
        exit 1
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "❌ Frontend process died!"
        kill $BACKEND_PID 2>/dev/null
        exit 1
    fi
    sleep 5
done
