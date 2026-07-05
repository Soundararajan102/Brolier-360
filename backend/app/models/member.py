from sqlalchemy import Column, Integer, String, Date, DateTime, Boolean
from sqlalchemy.sql import func
from app.db.base import Base

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    gender = Column(String(20))
    community = Column(String(100))
    district = Column(String(100))
    membership_type = Column(String(50), default="free", index=True) # free, premium
    expiry_date = Column(Date)
    status = Column(String(50), default="active", index=True) # active, expired
    created_at = Column(DateTime(timezone=True), server_default=func.now())
