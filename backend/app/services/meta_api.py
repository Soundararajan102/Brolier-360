import httpx
import logging
from typing import Dict, Any, Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

class MetaWhatsAppAPI:
    def __init__(self):
        self.base_url = "https://graph.facebook.com/v18.0"
        self.phone_number_id = settings.WA_PHONE_NUMBER_ID
        self.access_token = settings.WA_ACCESS_TOKEN
        self.headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

    async def send_template_message(
        self, 
        to_phone: str, 
        template_name: str, 
        language_code: str = "en", 
        components: Optional[list] = None
    ) -> Dict[str, Any]:
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        
        payload = {
            "messaging_product": "whatsapp",
            "to": to_phone,
            "type": "template",
            "template": {
                "name": template_name,
                "language": {
                    "code": language_code
                }
            }
        }
        
        if components:
            payload["template"]["components"] = components

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, headers=self.headers, json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as e:
                logger.error(f"WhatsApp API Error: {e.response.text}")
                raise e

    async def upload_media(self, file_path: str, mime_type: str) -> Dict[str, Any]:
        url = f"{self.base_url}/{self.phone_number_id}/media"
        
        headers = {
            "Authorization": f"Bearer {self.access_token}"
            # Content-Type is set automatically by httpx for multipart
        }
        
        async with httpx.AsyncClient() as client:
            with open(file_path, "rb") as f:
                files = {"file": (file_path.split("/")[-1], f, mime_type)}
                data = {"messaging_product": "whatsapp"}
                try:
                    response = await client.post(url, headers=headers, data=data, files=files)
                    response.raise_for_status()
                    return response.json()
                except httpx.HTTPStatusError as e:
                    logger.error(f"WhatsApp API Media Upload Error: {e.response.text}")
                    raise e
