from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    campaign_name = Column(String(255), nullable=False)
    message = Column(Text)
    template_id = Column(Integer, ForeignKey("templates.id"))
    poster = Column(String(255)) # URL or path to media
    status = Column(String(50), default="scheduled", index=True) # scheduled, running, completed, failed
    created_by = Column(Integer, ForeignKey("users.id"))
    scheduled_time = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    template = relationship("Template")
    creator = relationship("User")
    members = relationship("CampaignMember", back_populates="campaign")


class CampaignMember(Base):
    __tablename__ = "campaign_members"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False)
    wa_message_id = Column(String(255), index=True) # ID returned from WhatsApp API
    delivery_status = Column(String(50), default="pending", index=True) # pending, sent, delivered, failed
    read_status = Column(String(50), default="unread", index=True) # unread, read
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    campaign = relationship("Campaign", back_populates="members")
    member = relationship("Member")
