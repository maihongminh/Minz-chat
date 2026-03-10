#!/bin/bash

# Complete installation script for Discord Chat

set -e  # Exit on error

echo "🚀 Discord Chat - Complete Installation Script"
echo "================================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Function to print colored messages
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC}  $1"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root"
    exit 1
fi

# Step 1: Install System Dependencies
echo ""
print_step "Step 1: Installing System Dependencies"
echo ""

# Check OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    print_error "Cannot determine OS"
    exit 1
fi

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    print_step "Detected Ubuntu/Debian, installing packages..."
    
    sudo apt update
    sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib curl
    
    print_success "System packages installed"
else
    print_warning "OS not Ubuntu/Debian, please install manually:"
    echo "  - Python 3.8+"
    echo "  - PostgreSQL 12+"
    echo "  - curl"
    read -p "Press Enter when ready to continue..."
fi

# Step 2: Install Node.js
echo ""
print_step "Step 2: Installing Node.js"
echo ""

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js already installed: $NODE_VERSION"
else
    print_step "Installing Node.js via NVM..."
    
    # Install NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install Node.js LTS
    nvm install --lts
    nvm use --lts
    
    print_success "Node.js installed: $(node --version)"
fi

# Step 3: Setup PostgreSQL
echo ""
print_step "Step 3: Setting up PostgreSQL"
echo ""

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

print_success "PostgreSQL started"

# Create database and user
print_step "Creating database and user..."

sudo -u postgres psql -c "SELECT 1 FROM pg_database WHERE datname = 'chatdb'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE chatdb;"

sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname = 'chatuser'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER chatuser WITH PASSWORD 'chatpass';"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE chatdb TO chatuser;"

print_success "Database 'chatdb' and user 'chatuser' created"

# Step 4: Setup Backend
echo ""
print_step "Step 4: Setting up Backend"
echo ""

cd "$DIR/backend"

# Create virtual environment
if [ ! -d "venv" ]; then
    print_step "Creating virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_success "Virtual environment already exists"
fi

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
print_step "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1

# Install dependencies
print_step "Installing Python packages (this may take a few minutes)..."
pip install -r requirements.txt > /dev/null 2>&1
print_success "Python packages installed"

# Create .env file
if [ ! -f ".env" ]; then
    print_step "Creating .env file..."
    cp .env.example .env
    
    # Generate SECRET_KEY
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
    
    # Update .env file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/your-secret-key-change-this-in-production/$SECRET_KEY/" .env
    else
        # Linux
        sed -i "s/your-secret-key-change-this-in-production/$SECRET_KEY/" .env
    fi
    
    print_success ".env file created with generated SECRET_KEY"
else
    print_success ".env file already exists"
fi

# Step 5: Setup Frontend
echo ""
print_step "Step 5: Setting up Frontend"
echo ""

cd "$DIR/frontend"

# Install npm packages
print_step "Installing npm packages (this may take a few minutes)..."
npm install > /dev/null 2>&1
print_success "npm packages installed"

# Step 6: Create Super Admin
echo ""
print_step "Step 6: Creating Super Admin User"
echo ""

cd "$DIR/backend"
source venv/bin/activate

echo "Please enter Super Admin details:"
python create_superadmin.py

# Step 7: Summary
echo ""
echo "================================================"
echo -e "${GREEN}🎉 Installation Complete!${NC}"
echo "================================================"
echo ""
echo "📋 What was installed:"
echo "  ✓ PostgreSQL database (chatdb)"
echo "  ✓ Python virtual environment"
echo "  ✓ Backend dependencies (FastAPI, etc.)"
echo "  ✓ Frontend dependencies (React, etc.)"
echo "  ✓ Super Admin user"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "  1. Start the application:"
echo "     ${YELLOW}./START.sh${NC}"
echo ""
echo "  2. Open browser:"
echo "     Frontend: ${BLUE}http://localhost:3000${NC}"
echo "     API Docs: ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo "  3. Login with your Super Admin credentials"
echo ""
echo "  4. Check status anytime:"
echo "     ${YELLOW}./CHECK.sh${NC}"
echo ""
echo "  5. Stop the application:"
echo "     ${YELLOW}./STOP.sh${NC}"
echo ""
echo "📚 Documentation:"
echo "  - QUICKSTART.md  - Detailed setup guide"
echo "  - README.md      - Project overview"
echo "  - ADMIN_GUIDE.md - Admin panel guide"
echo ""
echo "Happy Chatting! 💬"
