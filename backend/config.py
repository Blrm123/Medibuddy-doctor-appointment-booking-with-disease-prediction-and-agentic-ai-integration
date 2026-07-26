import os
from pathlib import Path

# Try to load dotenv if available
try:
    from dotenv import load_dotenv
    env_path = Path(__file__).resolve().parent / ".env"
    load_dotenv(dotenv_path=env_path)
except ImportError:
    pass

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")
EMERGENCY_CONTACT = os.getenv("EMERGENCY_CONTACT", "")
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")
GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY", "")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "alibayram/medgemma:4b")


