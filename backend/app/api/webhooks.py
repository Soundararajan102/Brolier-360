from fastapi import APIRouter, Request, HTTPException, Depends
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.config import settings
from app.models.campaign import CampaignMember
from app.models.message import ChatMessage
from app.models.member import Member

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/whatsapp")
async def verify_webhook(request: Request):
    """
    Webhook Verification endpoint for Meta
    """
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode and token:
        if mode == "subscribe" and token == settings.WEBHOOK_VERIFY_TOKEN:
            return int(challenge)
        else:
            raise HTTPException(status_code=403, detail="Verification failed")
    raise HTTPException(status_code=400, detail="Missing parameters")

@router.post("/whatsapp")
async def receive_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receive webhook events from WhatsApp Cloud API
    """
    body = await request.json()

    # WhatsApp API webhook payload structure
    if body.get("object"):
        for entry in body.get("entry", []):
            for change in entry.get("changes", []):
                value = change.get("value", {})
                
                # Check for message statuses (delivered, read, failed)
                if "statuses" in value:
                    for status in value["statuses"]:
                        wa_message_id = status.get("id")
                        status_type = status.get("status") # delivered, read, failed
                        
                        # Find the corresponding CampaignMember
                        campaign_member = db.query(CampaignMember).filter(
                            CampaignMember.wa_message_id == wa_message_id
                        ).first()
                        
                        if campaign_member:
                            if status_type in ["delivered", "failed", "sent"]:
                                campaign_member.delivery_status = status_type
                            if status_type == "read":
                                campaign_member.read_status = "read"
                                if campaign_member.delivery_status in ["sent", "pending"]:
                                    campaign_member.delivery_status = "delivered"
                                
                            db.commit()
                            
                # Check for incoming messages
                if "messages" in value:
                    for message in value["messages"]:
                        wa_message_id = message.get("id")
                        from_number = message.get("from")
                        message_type = message.get("type", "text")
                        
                        # Extract content based on type
                        content = ""
                        if message_type == "text":
                            content = message.get("text", {}).get("body", "")
                        elif message_type == "button":
                            content = message.get("button", {}).get("text", "")
                        elif message_type == "interactive":
                            content = message.get("interactive", {}).get("button_reply", {}).get("title", "")
                            
                        # Find member by phone
                        member = db.query(Member).filter(Member.phone == from_number).first()
                        if member:
                            # Avoid duplicates
                            existing = db.query(ChatMessage).filter(ChatMessage.wa_message_id == wa_message_id).first()
                            if not existing:
                                chat_msg = ChatMessage(
                                    member_id=member.id,
                                    direction="inbound",
                                    message_type=message_type,
                                    content=content,
                                    wa_message_id=wa_message_id,
                                    status="received"
                                )
                                db.add(chat_msg)
                                db.commit()

        return {"status": "success"}
    
    raise HTTPException(status_code=404, detail="Not Found")
