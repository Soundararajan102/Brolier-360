from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import asyncio
import httpx

from app.db.session import SessionLocal
from app.models.campaign import Campaign, CampaignMember
from app.models.member import Member
from app.models.template import Template
from app.services.meta_api import MetaWhatsAppAPI

router = APIRouter()
meta_api = MetaWhatsAppAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class CampaignCreate(BaseModel):
    name: str
    template_id: int
    audience_type: str # all, premium, free, expired
    media_id: int = None

async def process_campaign_batch(campaign_id: int):
    """
    Background task to process campaign sending in chunks.
    Sends 500 messages, then sleeps to respect rate limits.
    """
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if not campaign:
            return
            
        template = db.query(Template).filter(Template.id == campaign.template_id).first()
        
        # Get pending members for this campaign
        pending_members = db.query(CampaignMember).filter(
            CampaignMember.campaign_id == campaign_id,
            CampaignMember.delivery_status == "pending"
        ).all()
        
        campaign.status = "running"
        db.commit()

        batch_size = 500
        for i in range(0, len(pending_members), batch_size):
            batch = pending_members[i:i + batch_size]
            
            for cm in batch:
                member = db.query(Member).filter(Member.id == cm.member_id).first()
                if not member:
                    continue
                    
                try:
                    components = []
                    if template.header_type in ["IMAGE", "VIDEO", "DOCUMENT"] and campaign.poster:
                        components.append({
                            "type": "header",
                            "parameters": [
                                {
                                    "type": template.header_type.lower(),
                                    template.header_type.lower(): {
                                        "id": campaign.poster
                                    }
                                }
                            ]
                        })
                        
                    response = await meta_api.send_template_message(
                        to_phone=member.phone,
                        template_name=template.template_name,
                        language_code=template.language,
                        components=components if components else None
                    )
                
                    # Store message ID returned by WhatsApp
                    wa_msg_id = response.get("messages", [{}])[0].get("id")
                    if wa_msg_id:
                        cm.wa_message_id = wa_msg_id
                        cm.delivery_status = "sent"
                        
                except Exception as e:
                    cm.delivery_status = "failed"
                    print(f"Failed to send to {member.phone}: {e}")
                    
            db.commit()
            
            # Wait to respect Meta API rate limits (e.g. max 500-1000 msgs/second/tier)
            if i + batch_size < len(pending_members):
                await asyncio.sleep(2) 

        campaign.status = "completed"
        db.commit()
        
    finally:
        db.close()


@router.post("/send")
async def create_and_send_campaign(
    payload: CampaignCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    # Retrieve template
    template = db.query(Template).filter(Template.id == payload.template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Validate media requirement
    if template.header_type in ["IMAGE", "VIDEO", "DOCUMENT"] and not payload.media_id:
        raise HTTPException(
            status_code=400, 
            detail=f"The selected template requires a {template.header_type} attachment. Please select media."
        )

    # Filter audience
    query = db.query(Member).filter(Member.status == "active")
    if payload.audience_type == "premium":
        query = query.filter(Member.membership_type == "premium")
    elif payload.audience_type == "free":
        query = query.filter(Member.membership_type == "free")
    elif payload.audience_type == "expired":
        query = db.query(Member).filter(Member.status == "expired")
        
    members = query.all()
    
    if not members:
        raise HTTPException(status_code=400, detail="No members found for this audience")

    # Fetch Media ID if provided
    media_str = None
    if payload.media_id:
        from app.models.media import Media
        media = db.query(Media).filter(Media.id == payload.media_id).first()
        if media:
            media_str = media.media_id

    # Create Campaign
    campaign = Campaign(
        campaign_name=payload.name,
        template_id=template.id,
        status="scheduled",
        poster=media_str
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Attach Members to Campaign
    campaign_members = [
        CampaignMember(campaign_id=campaign.id, member_id=m.id)
        for m in members
    ]
    db.bulk_save_objects(campaign_members)
    db.commit()

    # Dispatch to background task
    background_tasks.add_task(process_campaign_batch, campaign.id)

    return {
        "status": "success", 
        "message": f"Campaign scheduled. Processing {len(members)} members in the background.",
        "campaign_id": campaign.id
    }

@router.get("/reports")
def get_campaign_reports(db: Session = Depends(get_db)):
    reports = []
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    for c in campaigns:
        stats = db.query(
            CampaignMember.delivery_status,
            func.count(CampaignMember.id)
        ).filter(CampaignMember.campaign_id == c.id).group_by(CampaignMember.delivery_status).all()
        
        stat_dict = {status: count for status, count in stats}
        
        # Read status is separate, let's count read separately if read_status is present
        read_count = db.query(func.count(CampaignMember.id)).filter(
            CampaignMember.campaign_id == c.id,
            CampaignMember.read_status == "read"
        ).scalar() or 0

        # Sometimes Meta API delivery statuses are "sent", "delivered", "failed"
        total_sent = sum(stat_dict.values())
        delivered = stat_dict.get("delivered", 0) + stat_dict.get("read", 0) # if read implies delivered
        failed = stat_dict.get("failed", 0)
        
        reports.append({
            "id": c.id,
            "campaign": c.campaign_name,
            "date": c.created_at.strftime("%Y-%m-%d") if c.created_at else "N/A",
            "sent": total_sent,
            "delivered": delivered,
            "read": read_count,
            "failed": failed
        })
    return reports

@router.get("/{campaign_id}/live-stats")
def get_campaign_live_stats(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    stats = db.query(
        CampaignMember.delivery_status,
        func.count(CampaignMember.id)
    ).filter(CampaignMember.campaign_id == campaign_id).group_by(CampaignMember.delivery_status).all()
    
    stat_dict = {status: count for status, count in stats}
    
    read_count = db.query(func.count(CampaignMember.id)).filter(
        CampaignMember.campaign_id == campaign_id,
        CampaignMember.read_status == "read"
    ).scalar() or 0
    
    return {
        "status": campaign.status,
        "pending": stat_dict.get("pending", 0),
        "sent": stat_dict.get("sent", 0),
        "delivered": stat_dict.get("delivered", 0),
        "read": read_count,
        "failed": stat_dict.get("failed", 0)
    }
