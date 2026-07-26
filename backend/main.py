import sys
import os
from pathlib import Path

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from routers.chat import router as chat_router
from routers.diagnose import router as diagnose_router

app = FastAPI(
    title="Medibuddy Unified AI Backend",
    description="Unified Backend integrating Mental Health Agent Chat & Medical Diagnostics",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(chat_router)
app.include_router(diagnose_router)


@app.get("/")
async def health_check():
    return {
        "status": "online",
        "name": "Medibuddy Unified AI Backend",
        "endpoints": ["/ask", "/whatsapp_ask", "/predict/xray", "/predict/mri", "/predict/ultrasound", "/predict/symptoms"]
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
