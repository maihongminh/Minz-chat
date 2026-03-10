from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from ..core import get_db
from ..services import manager, authenticate_websocket, handle_websocket_message
from ..models import User

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None, db: Session = Depends(get_db)):
    # Authenticate user
    user = await authenticate_websocket(websocket, token, db)
    if not user:
        return
    
    # Connect user
    await manager.connect(websocket, user.id)
    
    # Update user status to online
    user.is_online = True
    user.last_seen = datetime.utcnow()
    db.commit()
    
    # Broadcast user online status
    await manager.broadcast_user_status(user.id, user.username, True)
    
    # Send initial online users list
    online_users = manager.get_online_users()
    await manager.send_personal_message({
        "type": "online_users",
        "user_ids": online_users
    }, user.id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            
            # Handle the message
            await handle_websocket_message(data, user, db)
            
    except WebSocketDisconnect:
        # Disconnect user
        manager.disconnect(websocket, user.id)
        
        # Update user status to offline if no more connections
        if not manager.is_user_online(user.id):
            user.is_online = False
            user.last_seen = datetime.utcnow()
            db.commit()
            
            # Broadcast user offline status
            await manager.broadcast_user_status(user.id, user.username, False)
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, user.id)
        
        if not manager.is_user_online(user.id):
            user.is_online = False
            user.last_seen = datetime.utcnow()
            db.commit()
            
            await manager.broadcast_user_status(user.id, user.username, False)
