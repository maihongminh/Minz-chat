#!/bin/bash

# Script để stop cả backend và frontend

echo "🛑 Stopping Discord Chat Application..."
echo ""

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

STOPPED=0

# Function to kill process by PID file
kill_by_pidfile() {
    local PIDFILE=$1
    local NAME=$2
    
    if [ -f "$PIDFILE" ]; then
        PID=$(cat "$PIDFILE")
        if kill -0 $PID 2>/dev/null; then
            echo "🔴 Stopping $NAME (PID: $PID)..."
            kill $PID 2>/dev/null
            sleep 2
            
            # Force kill if still running
            if kill -0 $PID 2>/dev/null; then
                echo "   Force killing $NAME..."
                kill -9 $PID 2>/dev/null
            fi
            
            echo "✅ $NAME stopped"
            STOPPED=1
        else
            echo "ℹ️  $NAME is not running (stale PID file)"
        fi
        rm -f "$PIDFILE"
    else
        echo "ℹ️  No PID file found for $NAME"
    fi
}

# Stop Backend
kill_by_pidfile "$DIR/.backend.pid" "Backend"

# Stop Frontend
kill_by_pidfile "$DIR/.frontend.pid" "Frontend"

echo ""

# Also kill by port (backup method)
echo "🔍 Checking for processes on ports..."

# Kill process on port 8000 (Backend)
BACKEND_PORT_PID=$(lsof -ti:8000 2>/dev/null)
if [ ! -z "$BACKEND_PORT_PID" ]; then
    echo "🔴 Killing Backend on port 8000 (PID: $BACKEND_PORT_PID)..."
    kill -9 $BACKEND_PORT_PID 2>/dev/null
    echo "✅ Backend stopped"
    STOPPED=1
fi

# Kill process on port 3000 (Frontend)
FRONTEND_PORT_PID=$(lsof -ti:3000 2>/dev/null)
if [ ! -z "$FRONTEND_PORT_PID" ]; then
    echo "🔴 Killing Frontend on port 3000 (PID: $FRONTEND_PORT_PID)..."
    kill -9 $FRONTEND_PORT_PID 2>/dev/null
    echo "✅ Frontend stopped"
    STOPPED=1
fi

echo ""

if [ $STOPPED -eq 1 ]; then
    echo "✅ Application stopped successfully!"
else
    echo "ℹ️  Application was not running"
fi

echo ""
echo "📋 To start again, run: ./START.sh"
