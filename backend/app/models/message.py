from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    direction = Column(String(50), nullable=False, index=True)  # "inbound" or "outbound"
    message_type = Column(String(50), nullable=False, index=True)  # "text", "image", "audio", "template"
    content = Column(Text, nullable=True) # Text content of the message
    media_url = Column(String(255), nullable=True) # URL if media
    wa_message_id = Column(String(255), nullable=True, unique=True, index=True) # ID returned by WhatsApp
    status = Column(String(50), default="received", index=True) # "received" (for inbound) or "sent", "delivered", "read" (for outbound)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    member = relationship("Member")
