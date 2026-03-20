# Quick Setup Guide

## Step-by-step Setup Instructions

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell, run:
CREATE DATABASE chatdb;
CREATE USER chatuser WITH PASSWORD 'chatpass';
GRANT ALL PRIVILEGES ON DATABASE chatdb TO chatuser;
\q
```

### 3. Backend Setup

```bash
# Navigate to backend directory
cd first-chat/backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Generate a secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Edit .env and paste the generated secret key
nano .env  # or use your preferred editor
```

Update `.env` file:
```env
DATABASE_URL=postgresql://chatuser:chatpass@localhost:5432/chatdb
SECRET_KEY=your-generated-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
APP_NAME=Discord-like Chat
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### 4. Frontend Setup

```bash
# Open a new terminal
cd first-chat/frontend

# Install dependencies
npm install

# Or use yarn
yarn install
```

### 5. Run Database Migrations

**For New Installations:**

```bash
cd first-chat/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Initialize database (creates all tables)
python3 init_db.py
```

**For Existing Installations (Upgrading):**

If you're upgrading from a previous version, run these migrations in order:

```bash
cd first-chat/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Migration 1: Add attachments table (v2.0)
python3 apply_migration.py

# Migration 2: Add reply_to_message_id column (v2.2)
python3 add_reply_column.py
```

You should see output like:
```
# For apply_migration.py:
Applying migration: Create attachments table...
✓ Migration applied successfully!
✓ Attachments table created
✓ Index created on message_id

# For add_reply_column.py:
✓ Column reply_to_message_id already exists
# OR
✓ Column reply_to_message_id added successfully!
```

**⚠️ Important:** Always backup your database before running migrations!

### 6. Run the Application

**Terminal 1 - Backend:**
```bash
cd first-chat/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd first-chat/frontend
npm run dev
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### 7. Create Your First Account

1. Go to http://localhost:3000
2. Click "Register"
3. Fill in:
   - Username: testuser
   - Email: test@example.com
   - Password: password123
   - Confirm Password: password123
4. Click "Continue"
5. You'll be automatically logged in and redirected to chat

### 8. Test the Chat

1. Create a room:
   - Click the "+" button next to "TEXT CHANNELS"
   - Enter room name: "general"
   - Click "Create Channel"

2. Send a message:
   - Type in the message box at the bottom
   - Press Enter to send

3. Test private messaging:
   - Open another browser (or incognito window)
   - Register a second user
   - In the original window, click on the second user in the member list
   - Send a private message

## Common Issues

### Issue: "Connection refused" on PostgreSQL
**Solution:** Make sure PostgreSQL is running
```bash
sudo systemctl status postgresql  # Linux
brew services list  # Mac
```

### Issue: "Module not found" errors in backend
**Solution:** Make sure virtual environment is activated and dependencies are installed
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: Frontend not connecting to backend
**Solution:** Check that:
1. Backend is running on port 8000
2. Frontend is running on port 3000
3. No firewall blocking the ports

### Issue: WebSocket connection fails
**Solution:** 
1. Check browser console for errors
2. Ensure you're logged in (token is valid)
3. Backend should show WebSocket connection logs

## Optional: OAuth Setup

### Google OAuth (Optional)

1. Visit: https://console.cloud.google.com/
2. Create a new project
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client ID"
5. Configure consent screen if prompted
6. Application type: Web application
7. Authorized redirect URIs: `http://localhost:8000/api/auth/google/callback`
8. Copy Client ID and Client Secret
9. Add to `.env`:
```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### GitHub OAuth (Optional)

1. Visit: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - Application name: Discord Chat
   - Homepage URL: http://localhost:3000
   - Authorization callback URL: `http://localhost:8000/api/auth/github/callback`
4. Click "Register application"
5. Copy Client ID and generate a Client Secret
6. Add to `.env`:
```env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

## Production Deployment Tips

1. **Database:** Use managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
2. **Backend:** Deploy to services like:
   - Heroku
   - DigitalOcean App Platform
   - AWS Elastic Beanstalk
   - Railway
3. **Frontend:** Deploy to:
   - Vercel
   - Netlify
   - Cloudflare Pages
4. **Environment Variables:** Set all `.env` variables in production
5. **CORS:** Update CORS origins in `backend/app/main.py`
6. **HTTPS:** Use HTTPS in production for WebSocket security

## Need Help?

- Check the main README.md for detailed documentation
- Review API documentation at http://localhost:8000/docs
- Check browser console for frontend errors
- Check terminal output for backend errors
