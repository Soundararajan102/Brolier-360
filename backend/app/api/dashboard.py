from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.session import SessionLocal
from app.models.member import Member
from app.models.campaign import Campaign, CampaignMember

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_members = db.query(func.count(Member.id)).scalar() or 0
    campaigns_sent = db.query(func.count(Campaign.id)).scalar() or 0
    
    delivered_messages = db.query(func.count(CampaignMember.id)).filter(
        CampaignMember.delivery_status == "delivered"
    ).scalar() or 0
    
    failed_messages = db.query(func.count(CampaignMember.id)).filter(
        CampaignMember.delivery_status == "failed"
    ).scalar() or 0
    
    return {
        "totalMembers": total_members,
        "campaignsSent": campaigns_sent,
        "deliveredMessages": delivered_messages,
        "failedMessages": failed_messages
    }
