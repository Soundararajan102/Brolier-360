from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine
from app.db.base import Base
from app.models.message import ChatMessage

# Create database tables (in a real app, use Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

from fastapi.staticfiles import StaticFiles
import os

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads/media", exist_ok=True)
app.mount("/media", StaticFiles(directory="uploads/media"), name="media")

from app.api import webhooks, members, campaigns, templates, media, inbox, dashboard

@app.get("/")
def root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

app.include_router(webhooks.router, prefix="/api/webhooks", tags=["Webhooks"])
app.include_router(members.router, prefix="/api/members", tags=["Members"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["Campaigns"])
app.include_router(templates.router, prefix="/api/templates", tags=["Templates"])
app.include_router(media.router, prefix="/api/media", tags=["Media"])
app.include_router(inbox.router, prefix="/api/inbox", tags=["Inbox"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
