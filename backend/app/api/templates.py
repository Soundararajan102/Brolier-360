from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx

from app.db.session import SessionLocal
from app.models.template import Template
from app.core.config import settings

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_templates(db: Session = Depends(get_db)):
    """
    Get all templates from local DB.
    """
    templates = db.query(Template).all()
    return templates

@router.get("/sync")
async def sync_templates_from_meta(db: Session = Depends(get_db)):
    """
    Fetch approved templates from Meta API and sync to local DB.
    """
    url = f"https://graph.facebook.com/v18.0/{settings.WA_BUSINESS_ACCOUNT_ID}/message_templates"
    headers = {
        "Authorization": f"Bearer {settings.WA_ACCESS_TOKEN}"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            templates = data.get("data", [])
            synced_count = 0
            
            for t in templates:
                # We only want APPROVED templates
                if t.get("status") != "APPROVED":
                    continue
                    
                template_name = t.get("name")
                template_id = t.get("id")
                
                # Extract components
                body_text = None
                header_type = None
                buttons = []
                
                components = t.get("components", [])
                for comp in components:
                    if comp.get("type") == "BODY":
                        body_text = comp.get("text")
                    elif comp.get("type") == "HEADER":
                        header_type = comp.get("format")
                    elif comp.get("type") == "BUTTONS":
                        buttons = comp.get("buttons", [])

                # Check if exists
                existing = db.query(Template).filter(Template.template_name == template_name).first()
                if existing:
                    # Update fields if they were null previously
                    if not existing.body_text and body_text:
                        existing.body_text = body_text
                    if not existing.header_type and header_type:
                        existing.header_type = header_type
                    if not existing.buttons and buttons:
                        existing.buttons = buttons
                else:
                    new_template = Template(
                        template_name=template_name,
                        template_id=template_id,
                        language=t.get("language"),
                        category=t.get("category"),
                        status=t.get("status"),
                        body_text=body_text,
                        header_type=header_type,
                        buttons=buttons
                    )
                    db.add(new_template)
                    synced_count += 1
                    
            db.commit()
            return {"status": "success", "message": f"Synced {synced_count} new templates"}
            
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=500, detail=f"Meta API Error: {e.response.text}")
