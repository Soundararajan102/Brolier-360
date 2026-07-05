from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class Media(Base):
    __tablename__ = "media"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True) # Custom name
    file_type = Column(String(50)) # poster, video, pdf
    file_url = Column(String(255))
    media_id = Column(String(255), unique=True) # ID returned from WhatsApp API
    created_at = Column(DateTime(timezone=True), server_default=func.now())
