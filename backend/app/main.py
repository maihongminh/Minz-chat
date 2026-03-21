from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core import Base, engine
from .api import auth_router, users_router, rooms_router, messages_router
from .api.websocket import router as websocket_router
from .api.admin import router as admin_router
from .api.reactions import router as reactions_router

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Discord-like Chat API",
    description="Real-time chat application with WebSocket support",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(rooms_router, prefix="/api")
app.include_router(messages_router, prefix="/api")
app.include_router(websocket_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(reactions_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "Discord-like Chat API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
