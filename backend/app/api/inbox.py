from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Dict, Any

from app.db.session import SessionLocal
from app.models.message import ChatMessage
from app.models.member import Member

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/conversations", response_model=List[Dict[str, Any]])
def get_conversations(db: Session = Depends(get_db)):
    """
    Get a list of members who have recent messages, ordered by the latest message timestamp.
    """
    # Subquery to get the latest message per member
    # In a production app, we would use a proper GROUP BY / window function.
    # For now, we'll just fetch all distinct members that have messages and order them.
    
    # Get members who have at least one message
    members_with_messages = db.query(Member).join(ChatMessage).distinct().all()
    
    conversations = []
    for member in members_with_messages:
        latest_msg = db.query(ChatMessage).filter(
            ChatMessage.member_id == member.id
        ).order_by(desc(ChatMessage.timestamp)).first()
        
        conversations.append({
            "member_id": member.id,
            "name": member.name,
            "phone": member.phone,
            "latest_message": latest_msg.content if latest_msg else "",
            "latest_timestamp": latest_msg.timestamp if latest_msg else None,
            "unread_count": db.query(ChatMessage).filter(
                ChatMessage.member_id == member.id,
                ChatMessage.direction == "inbound",
                ChatMessage.status == "received"
            ).count()
        })
        
    # Sort by timestamp descending
    conversations.sort(key=lambda x: x["latest_timestamp"] if x["latest_timestamp"] else 0, reverse=True)
    return conversations

@router.get("/{member_id}/messages")
def get_member_messages(member_id: int, db: Session = Depends(get_db)):
    """
    Get the full chat history for a specific member.
    """
    messages = db.query(ChatMessage).filter(
        ChatMessage.member_id == member_id
    ).order_by(ChatMessage.timestamp).all()
    
    return [
        {
            "id": msg.id,
            "direction": msg.direction,
            "message_type": msg.message_type,
            "content": msg.content,
            "status": msg.status,
            "timestamp": msg.timestamp
        }
        for msg in messages
    ]
