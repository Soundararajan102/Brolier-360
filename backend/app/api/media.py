import fastapi
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
import os
import shutil

from app.db.session import SessionLocal
from app.models.media import Media
from app.services.meta_api import MetaWhatsAppAPI

router = APIRouter()
meta_api = MetaWhatsAppAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/upload")
async def upload_media(file: UploadFile = File(...), name: str = fastapi.Form(None), db: Session = Depends(get_db)):
    """
    Upload media (image/video/pdf) to local storage, then to Meta API.
    Saves the returned media_id to DB for future template usage.
    """
    # 1. Save locally
    upload_dir = "uploads/media"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # 2. Upload to Meta API
    try:
        response = await meta_api.upload_media(file_path, file.content_type)
        media_id = response.get("id")
        
        if not media_id:
            raise HTTPException(status_code=500, detail="Failed to get media_id from Meta")
            
        # 3. Save to DB
        new_media = Media(
            name=name,
            file_type=file.content_type,
            file_url=file_path,
            media_id=media_id
        )
        db.add(new_media)
        db.commit()
        
        return {"status": "success", "media_id": media_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/")
def get_media(db: Session = Depends(get_db)):
    """Fetch all uploaded media items."""
    media_items = db.query(Media).order_by(Media.created_at.desc()).all()
    result = []
    for m in media_items:
        # Provide a friendly type (image, video, pdf, etc.) based on mime type
        file_type = "image"
        if "video" in (m.file_type or ""):
            file_type = "video"
        elif "pdf" in (m.file_type or ""):
            file_type = "pdf"
            
        result.append({
            "id": m.id,
            "name": m.name if m.name else (m.file_url.split("/")[-1] if m.file_url else "unknown"),
            "type": file_type,
            "url": f"http://localhost:8000/media/{m.file_url.split('/')[-1]}" if m.file_url else "",
            "date": m.created_at.strftime("%Y-%m-%d") if m.created_at else "N/A"
        })
    return result

@router.delete("/{media_id}")
def delete_media(media_id: int, db: Session = Depends(get_db)):
    """Delete a media item from the database and local storage."""
    media_item = db.query(Media).filter(Media.id == media_id).first()
    if not media_item:
        raise HTTPException(status_code=404, detail="Media not found")
        
    # Delete local file if it exists
    if media_item.file_url and os.path.exists(media_item.file_url):
        try:
            os.remove(media_item.file_url)
        except Exception as e:
            print(f"Failed to delete local file: {e}")
            
    # Delete from database
    db.delete(media_item)
    db.commit()
    
    return {"status": "success", "message": "Media deleted successfully"}
