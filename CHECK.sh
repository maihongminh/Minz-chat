#!/bin/bash

# Script to check system requirements and setup status

echo "🔍 Checking Discord Chat Requirements..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        if [ ! -z "$2" ]; then
            VERSION=$($1 $2 2>&1 | head -n 1)
            echo "  Version: $VERSION"
        fi
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        return 1
    fi
}

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        PID=$(lsof -ti:$1)
        echo -e "${YELLOW}⚠${NC}  Port $1 is in use (PID: $PID)"
        return 1
    else
        echo -e "${GREEN}✓${NC} Port $1 is available"
        return 0
    fi
}

# System Requirements
echo "=== System Requirements ==="
check_command python3 "--version"
check_command node "--version"
check_command npm "--version"
check_command psql "--version"
check_command pip3 "--version"
echo ""

# PostgreSQL Status
echo "=== PostgreSQL Status ==="
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓${NC} PostgreSQL is running"
else
    echo -e "${RED}✗${NC} PostgreSQL is NOT running"
    echo "  Start with: sudo systemctl start postgresql"
fi
echo ""

# Database Check
echo "=== Database Check ==="
if PGPASSWORD=chatpass psql -U chatuser -d chatdb -h localhost -c "SELECT 1" &> /dev/null; then
    echo -e "${GREEN}✓${NC} Database 'chatdb' exists and is accessible"
    
    # Count tables
    TABLE_COUNT=$(PGPASSWORD=chatpass psql -U chatuser -d chatdb -h localhost -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    echo "  Tables: $TABLE_COUNT"
else
    echo -e "${RED}✗${NC} Cannot connect to database 'chatdb'"
    echo "  Create with: sudo -u postgres psql -c \"CREATE DATABASE chatdb;\""
fi
echo ""

# Project Structure
echo "=== Project Structure ==="
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -d "$DIR/backend" ]; then
    echo -e "${GREEN}✓${NC} Backend directory exists"
else
    echo -e "${RED}✗${NC} Backend directory NOT found"
fi

if [ -d "$DIR/frontend" ]; then
    echo -e "${GREEN}✓${NC} Frontend directory exists"
else
    echo -e "${RED}✗${NC} Frontend directory NOT found"
fi
echo ""

# Backend Setup
echo "=== Backend Setup ==="
if [ -d "$DIR/backend/venv" ]; then
    echo -e "${GREEN}✓${NC} Virtual environment exists"
else
    echo -e "${RED}✗${NC} Virtual environment NOT found"
    echo "  Create with: cd backend && python3 -m venv venv"
fi

if [ -f "$DIR/backend/.env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
else
    echo -e "${RED}✗${NC} .env file NOT found"
    echo "  Create with: cd backend && cp .env.example .env"
fi

if [ -f "$DIR/backend/requirements.txt" ]; then
    echo -e "${GREEN}✓${NC} requirements.txt exists"
else
    echo -e "${RED}✗${NC} requirements.txt NOT found"
fi
echo ""

# Frontend Setup
echo "=== Frontend Setup ==="
if [ -d "$DIR/frontend/node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
else
    echo -e "${RED}✗${NC} node_modules NOT found"
    echo "  Install with: cd frontend && npm install"
fi

if [ -f "$DIR/frontend/package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json exists"
else
    echo -e "${RED}✗${NC} package.json NOT found"
fi
echo ""

# Port Availability
echo "=== Port Availability ==="
check_port 8000
check_port 3000
echo ""

# Running Processes
echo "=== Running Processes ==="
if [ -f "$DIR/.backend.pid" ]; then
    BACKEND_PID=$(cat "$DIR/.backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Backend is running (PID: $BACKEND_PID)"
    else
        echo -e "${YELLOW}⚠${NC}  Backend PID file exists but process not running"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Backend is not running"
fi

if [ -f "$DIR/.frontend.pid" ]; then
    FRONTEND_PID=$(cat "$DIR/.frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Frontend is running (PID: $FRONTEND_PID)"
    else
        echo -e "${YELLOW}⚠${NC}  Frontend PID file exists but process not running"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Frontend is not running"
fi
echo ""

# Summary
echo "=== Summary ==="
echo "Next steps:"
echo "  1. If PostgreSQL not running: sudo systemctl start postgresql"
echo "  2. If database not exists: Follow QUICKSTART.md Step 2"
echo "  3. If venv not exists: cd backend && python3 -m venv venv"
echo "  4. If .env not exists: cd backend && cp .env.example .env"
echo "  5. If packages not installed: cd backend && pip install -r requirements.txt"
echo "  6. If node_modules not exists: cd frontend && npm install"
echo "  7. Start app: ./START.sh"
echo ""
echo "Documentation:"
echo "  📘 QUICKSTART.md  - Detailed setup guide"
echo "  📗 README.md      - Project overview"
echo "  📙 ADMIN_GUIDE.md - Admin features"
