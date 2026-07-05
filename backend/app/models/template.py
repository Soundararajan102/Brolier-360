from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from app.db.base import Base

class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    template_name = Column(String(255), unique=True, index=True, nullable=False)
    template_id = Column(String(255), unique=True, nullable=False)
    language = Column(String(50), default="en")
    category = Column(String(100), index=True) # e.g. MARKETING, UTILITY
    status = Column(String(50), default="APPROVED", index=True)
    body_text = Column(String, nullable=True)
    header_type = Column(String(50), nullable=True)
    buttons = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
