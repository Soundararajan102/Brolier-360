from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
import pandas as pd
import io

from app.db.session import SessionLocal
from app.models.member import Member

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class MemberCreate(BaseModel):
    name: str
    phone: str
    gender: Optional[str] = None
    community: Optional[str] = None
    district: Optional[str] = None
    membership_type: Optional[str] = "free"

class MemberUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    gender: Optional[str] = None
    community: Optional[str] = None
    district: Optional[str] = None
    membership_type: Optional[str] = None

@router.get("/")
def get_members(db: Session = Depends(get_db)):
    """
    Get all members from local DB.
    """
    members = db.query(Member).order_by(Member.created_at.desc()).all()
    return members

@router.post("/")
def create_member(member: MemberCreate, db: Session = Depends(get_db)):
    """
    Create a single member.
    """
    existing_member = db.query(Member).filter(Member.phone == member.phone).first()
    if existing_member:
        raise HTTPException(status_code=400, detail="Member with this phone number already exists")
        
    new_member = Member(
        name=member.name,
        phone=member.phone,
        gender=member.gender,
        community=member.community,
        district=member.district,
        membership_type=member.membership_type
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member

@router.put("/{member_id}")
def update_member(member_id: int, member: MemberUpdate, db: Session = Depends(get_db)):
    """Update an existing member."""
    existing_member = db.query(Member).filter(Member.id == member_id).first()
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    update_data = member.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(existing_member, key, value)
        
    db.commit()
    db.refresh(existing_member)
    return existing_member

@router.delete("/{member_id}")
def delete_member(member_id: int, db: Session = Depends(get_db)):
    """Delete a member."""
    existing_member = db.query(Member).filter(Member.id == member_id).first()
    if not existing_member:
        raise HTTPException(status_code=404, detail="Member not found")
        
    db.delete(existing_member)
    db.commit()
    return {"status": "success", "message": "Member deleted successfully"}

@router.get("/export")
def export_members_csv(db: Session = Depends(get_db)):
    """
    Export all members as a CSV file.
    """
    members = db.query(Member).all()
    
    # Create DataFrame
    data = []
    for m in members:
        data.append({
            "Name": m.name,
            "Phone": m.phone,
            "Gender": m.gender or "",
            "Community": m.community or "",
            "District": m.district or "",
            "Membership Type": m.membership_type,
            "Status": m.status,
            "Joined": m.created_at.strftime("%Y-%m-%d") if m.created_at else ""
        })
        
    df = pd.DataFrame(data)
    
    # Write to string buffer
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=members_export.csv"
    return response

@router.post("/upload")
async def upload_members(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import members from CSV or Excel file.
    Validates and removes duplicates based on phone number.
    """
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
    
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
        # Expected columns: name, phone, gender, community, district, membership_type
        # We will standardize column names to lowercase
        df.columns = [col.lower().strip() for col in df.columns]
        
        required_columns = ["name", "phone"]
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail=f"Missing required columns: {required_columns}")

        # Remove duplicate phones from the uploaded file
        df = df.drop_duplicates(subset=["phone"])

        # Insert logic
        added_count = 0
        duplicate_count = 0

        for _, row in df.iterrows():
            phone = str(row["phone"]).strip()
            
            # Check if member already exists
            existing_member = db.query(Member).filter(Member.phone == phone).first()
            if existing_member:
                duplicate_count += 1
                continue
                
            new_member = Member(
                name=row["name"],
                phone=phone,
                gender=row.get("gender"),
                community=row.get("community"),
                district=row.get("district"),
                membership_type=row.get("membership_type", "free")
            )
            db.add(new_member)
            added_count += 1
            
        db.commit()
        
        return {
            "status": "success",
            "message": f"Successfully imported {added_count} members. Skipped {duplicate_count} duplicates."
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
