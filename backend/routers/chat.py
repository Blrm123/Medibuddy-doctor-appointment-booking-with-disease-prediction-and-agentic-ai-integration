from fastapi import APIRouter, Form
from pydantic import BaseModel
from typing import Optional, List
from agent import process_mental_health_chat
from utils.twiml import twiml_message

router = APIRouter(tags=["chat"])

class ChatQuery(BaseModel):
    message: str
    history: Optional[List[dict]] = None


@router.post("/ask")
async def ask(query: ChatQuery):
    """
    Main chat endpoint used by Next.js frontend /api/chat route.
    """
    res = process_mental_health_chat(query.message, query.history)
    return res


@router.post("/whatsapp_ask")
async def whatsapp_ask(
    Body: str = Form(""),
    From: str = Form(""),
    To: str = Form(""),
    Latitude: str = Form(""),
    Longitude: str = Form("")
):
    """
    Twilio WhatsApp webhook endpoint with logging for debugging.
    """
    print(f"\n💬 [WhatsApp Webhook Received] From: {From} | Message: '{Body}' | Lat/Lon: '{Latitude},{Longitude}'")
    try:
        user_text = Body.strip() if Body else ""
        if Latitude and Longitude:
            user_text = f"Where is the nearest hospital? ({Latitude}, {Longitude})"
        elif not user_text:
            user_text = "Hello"

        res = process_mental_health_chat(user_text)
        response_text = res.get("response") or "I'm here to support you, but I couldn't generate a response just now."
        print(f"✅ [WhatsApp Webhook Reply] Sending back to {From}: '{response_text[:100]}...'")
        return twiml_message(response_text)
    except Exception as e:
        print(f"❌ [WhatsApp Webhook Error] {e}")
        return twiml_message("I am currently having trouble processing your request. Please try again in a moment.")


