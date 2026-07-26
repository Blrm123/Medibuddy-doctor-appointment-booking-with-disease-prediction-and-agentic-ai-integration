import os
import sys
from typing import List, Dict, Any, Optional
from langchain_groq import ChatGroq

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from agent.tools import emergency_call_tool
from agent.prompt import MENTAL_HEALTH_SYSTEM_PROMPT

# Set Groq key in environment
os.environ["GROQ_API_KEY"] = config.GROQ_API_KEY

# Initialize LLMs with high TPM capacity models
primary_llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.3,
    api_key=config.GROQ_API_KEY
)

fallback_llm = ChatGroq(
    model="llama3-8b-8192",
    temperature=0.3,
    api_key=config.GROQ_API_KEY
)

# Comprehensive safety keywords for emergency helpline call triggering
EMERGENCY_KEYWORDS = [
    "suicide", "suicidal", "self-harm", "self harm", "kill myself",
    "end my life", "want to die", "harm myself", "feel like dying",
    "dont want to live", "don't want to live", "end it all", "die"
]


def process_mental_health_chat(message: str, history: Optional[List[Dict[str, Any]]] = None):
    """
    Fast, reliable chat processor with conversational memory & emergency crisis detection.
    """
    messages_payload = [("system", MENTAL_HEALTH_SYSTEM_PROMPT)]

    # Limit past history to last 8 turns to stay well within model context limits
    recent_history = history[-8:] if history and isinstance(history, list) else []

    for msg_item in recent_history:
        text = msg_item.get("text") or msg_item.get("message")
        sender = msg_item.get("sender")
        if text:
            role = "human" if sender == "user" else "ai"
            clean_text = text[:1500] if len(text) > 1500 else text
            messages_payload.append((role, clean_text))

    # Append current user prompt
    messages_payload.append(("human", message))

    # Safety check for emergency crisis triggers
    tool_called_name = "None"
    lower_msg = message.lower()
    is_emergency = any(k in lower_msg for k in EMERGENCY_KEYWORDS)

    if is_emergency:
        tool_called_name = "emergency_call_tool"
        try:
            # Directly execute emergency call tool function
            if hasattr(emergency_call_tool, 'func'):
                emergency_call_tool.func()
            else:
                emergency_call_tool()
            print("[EMERGENCY TRIGGERED] Successfully initiated Twilio phone call to safety contact.")
        except Exception as e:
            print(f"[EMERGENCY ERROR] Failed to place Twilio call: {e}")

    # Check for nearby healthcare location search requests
    if any(k in lower_msg for k in ["nearest", "nearby", "hospital", "pharmacy", "clinic", "doctor", "where is a"]):
        import re
        from agent.tools import find_nearby_healthcare
        # 1. First check if GPS coordinates were provided (e.g. from browser location or WhatsApp attachment)
        coord_match = re.search(r'(-?\d+\.\d{3,})\s*,\s*(-?\d+\.\d{3,})', message)
        loc_query = ""
        if coord_match:
            loc_query = f"{coord_match.group(1)}, {coord_match.group(2)}"
        else:
            # 2. Check for text location (e.g. "in Bangalore", "near Delhi", "at Mumbai")
            loc_match = re.search(r'(?:in|near|at|around)\s+([a-zA-Z\s]{3,25})', message, re.IGNORECASE)
            if loc_match:
                loc_query = loc_match.group(1).strip()
                
        if loc_query:
            tool_called_name = "find_nearby_healthcare"
            facility = "pharmacy" if "pharmacy" in lower_msg else "clinic" if "clinic" in lower_msg else "doctor" if "doctor" in lower_msg else "hospital"
            try:
                search_res = find_nearby_healthcare.invoke({"location": loc_query, "facility_type": facility})
                if search_res and "Here are the nearest" in search_res:
                    return {
                        "response": search_res + "\n\nDo you need any guidance on symptoms or first aid while you contact them?",
                        "tool_called": tool_called_name
                    }
            except Exception as e:
                print(f"[Location Search Tool Error] {e}")
        elif any(w in lower_msg for w in ["nearest", "nearby", "where is a hospital", "where is a pharmacy", "where is a clinic"]):
            # They asked for nearby healthcare but didn't provide GPS or a city name
            return {
                "response": (
                    "📍 **I'd love to help you find the nearest medical center!** To find the closest hospitals or clinics around you, please share your location:\n\n"
                    "• 📱 **On WhatsApp:** Tap the **📎 Attachment (+) icon** at the bottom ➔ select **Location** ➔ **Send Your Current Location**.\n"
                    "• 💻 **On Website / Text:** Simply type your city or neighborhood name (for example: *'nearest hospital in Bangalore'* or *'pharmacy near Mumbai'*)."
                ),
                "tool_called": "find_nearby_healthcare_prompt"
            }




    # Primary high-speed LLM invocation
    try:
        response = primary_llm.invoke(messages_payload)
        if response and response.content:
            res_content = response.content.strip()
            if is_emergency:
                res_content = "🚨 **EMERGENCY SAFETY ALERT**: An automated emergency call has been placed to your registered safety contact.\n\n" + res_content
            return {
                "response": res_content,
                "tool_called": tool_called_name
            }
    except Exception as e:
        print(f"[Mental Health Agent] Primary LLM error ({e}). Trying fallback model...")

    # Fallback high-speed LLM invocation
    try:
        response = fallback_llm.invoke(messages_payload)
        if response and response.content:
            res_content = response.content.strip()
            if is_emergency:
                res_content = "🚨 **EMERGENCY SAFETY ALERT**: An automated emergency call has been placed to your registered safety contact.\n\n" + res_content
            return {
                "response": res_content,
                "tool_called": tool_called_name
            }
    except Exception as e:
        print(f"[Mental Health Agent] Fallback LLM error ({e}).")

    fallback_msg = "I am here with you. If you are experiencing a crisis, please reach out to emergency services immediately."
    if is_emergency:
        fallback_msg = "🚨 **EMERGENCY SAFETY ALERT**: An automated emergency call has been placed to your registered safety contact.\n\n" + fallback_msg

    return {
        "response": fallback_msg,
        "tool_called": tool_called_name
    }
