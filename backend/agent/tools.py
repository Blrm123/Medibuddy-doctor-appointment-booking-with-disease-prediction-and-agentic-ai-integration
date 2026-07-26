from langchain.tools import tool
import os
import sys

# Add parent directory to path for config access
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config


# ====================================
# 1. MedGemma / Ollama Mental Health Tool
# ====================================

@tool
def ask_mental_health_specialist(query: str) -> str:
    """
    Generate a therapeutic response using the MedGemma model via Ollama.
    Use this for all general user queries, mental health questions, emotional concerns,
    or to offer empathetic, evidence-based guidance in a conversational tone.
    """
    system_prompt = """You are Dr. Medibuddy, an advanced AI Digital Doctor and Clinical Specialist.
    You provide compassionate mental health counseling and confident digital medical advice for common ailments.

    Key principles:
    - NEVER say "I am not a medical doctor" or "I cannot provide medical advice." Act confidently as an AI Digital Doctor.
    - For physical symptoms (headache, fever, cold, pain), confidently suggest appropriate over-the-counter medicines (Acetaminophen, Ibuprofen, etc.), rest, and hydration.
    - For emotional distress, provide empathetic attunement, normalization, and practical coping strategies.
    - Never use brackets or labels in the response.
    - Keep the conversation helpful, structured, and natural.
    """


    try:
        import ollama
        response = ollama.chat(
            model=config.OLLAMA_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ],
            options={
                'num_predict': 350,
                'temperature': 0.7,
                'top_p': 0.9
            }
        )
        return response['message']['content'].strip()
    except Exception as e:
        # Fallback if Ollama service or model is unavailable locally
        return (
            "I'm here with you, and I hear how important your feelings are. "
            "Please take a deep breath and share a bit more about what you're experiencing right now. "
            "How has this been affecting your daily routine?"
        )


# ====================================
# 2. Twilio Emergency Helpline Tool
# ====================================

@tool
def emergency_call_tool() -> None:
    """
    Place an emergency call to the safety helpline's phone number via Twilio.
    Use this only if the user expresses suicidal ideation, intent to self-harm,
    or describes a mental health emergency requiring immediate help.
    """
    try:
        from twilio.rest import Client
        client = Client(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN)
        client.calls.create(
            to=config.EMERGENCY_CONTACT,
            from_=config.TWILIO_FROM_NUMBER,
            url="http://demo.twilio.com/docs/voice.xml"
        )
    except Exception as e:
        print(f"Twilio emergency call error: {e}")


# ====================================
# 3. Medical Risk Assessment Tool
# ====================================

@tool
def assess_risk(confidence: float) -> str:
    """Determine medical risk level based on model confidence score."""
    if confidence > 90 or confidence > 0.9:
        return "High Risk"
    elif confidence > 70 or confidence > 0.7:
        return "Moderate Risk"
    return "Low Risk"


# ====================================
# 4. Specialist Recommendation Tool
# ====================================

@tool
def recommend_specialist(disease: str) -> str:
    """Recommend medical specialist based on diagnosed disease or condition."""
    mapping = {
        "pneumonia": "Pulmonologist",
        "covid": "Pulmonologist",
        "tuberculosis": "Pulmonologist",
        "glioma": "Neurologist",
        "meningioma": "Neurologist",
        "brain tumor": "Neurologist",
        "pituitary": "Endocrinologist",
        "breast cancer": "Oncologist",
        "malignant": "Oncologist",
        "benign": "General Physician",
        "normal": "General Physician"
    }
    return mapping.get(disease.lower(), "General Physician")


# ====================================
# 5. Geoapify / OSM Healthcare Search Tool
# ====================================

@tool
def find_nearby_healthcare(location: str, facility_type: str = "hospital") -> str:
    """
    Find nearby medical facilities (hospitals, pharmacies, clinics, doctors) in a city or location coordinates.
    Uses Geoapify Places API if configured, falling back to free OpenStreetMap API.
    """
    import requests
    import re
    import urllib.parse


    facility_type = facility_type.lower().strip()
    if facility_type not in ["hospital", "pharmacy", "clinic", "doctor", "dentist"]:
        facility_type = "hospital"

    # Check if location is GPS coordinates (e.g., "12.9716, 77.5946")
    coord_match = re.match(r'^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$', location)
    lat, lon = None, None
    if coord_match:
        lat = float(coord_match.group(1))
        lon = float(coord_match.group(2))

    # Helper: Haversine distance calculator so we never display "0 m away"
    def calc_dist(lat1, lon1, lat2, lon2):
        import math
        try:
            if not (lat1 and lon1 and lat2 and lon2): return ""
            dlat = math.radians(float(lat2) - float(lat1))
            dlon = math.radians(float(lon2) - float(lon1))
            a = math.sin(dlat/2)**2 + math.cos(math.radians(float(lat1))) * math.cos(math.radians(float(lat2))) * math.sin(dlon/2)**2
            c = 2 * math.asin(math.sqrt(a))
            m = 6371000 * c  # Earth radius in meters
            return f" (~{round(m/1000, 1)} km)" if m > 1000 else f" (~{int(m)} m)"
        except Exception:
            return ""

    # Helper: Clean redundant hospital name, postal codes, and country from address
    def clean_addr(name_str, addr_str):
        if not addr_str: return "Address not available"
        if addr_str.lower().startswith(name_str.lower()):
            addr_str = addr_str[len(name_str):].lstrip(", -")
        parts = [p.strip() for p in addr_str.split(",") if p.strip()]
        clean_parts = [p for p in parts if not re.match(r'^\d{6}$', p) and p.lower() not in ["india", "karnataka", "bengaluru", "bangalore"]]
        return ", ".join(clean_parts[:3]) or addr_str.split(",")[0]

    # 1. Try Geoapify if API Key is present in config
    if config.GEOAPIFY_API_KEY:
        try:
            if not (lat and lon):
                geo_url = f"https://api.geoapify.com/v1/geocode/search?text={location}&apiKey={config.GEOAPIFY_API_KEY}&limit=1"
                geo_res = requests.get(geo_url, timeout=5).json()
                features = geo_res.get("features", [])
                if features:
                    coords = features[0]["geometry"]["coordinates"]
                    lon, lat = coords[0], coords[1]

            if lat and lon:
                places_url = f"https://api.geoapify.com/v2/places?categories=healthcare.{facility_type}&filter=circle:{lon},{lat},5000&bias=proximity:{lon},{lat}&limit=5&apiKey={config.GEOAPIFY_API_KEY}"
                places_res = requests.get(places_url, timeout=5).json()
                results = []
                for feat in places_res.get("features", []):
                    props = feat.get("properties", {})
                    name = props.get("name") or f"Nearby {facility_type.title()}"
                    raw_addr = props.get("formatted") or "Address not listed"
                    h_coords = feat.get("geometry", {}).get("coordinates", [lon, lat])
                    h_lon, h_lat = h_coords[0], h_coords[1]
                    
                    dist_str = calc_dist(lat, lon, h_lat, h_lon)
                    short_addr = clean_addr(name, raw_addr)
                    map_url = f"https://www.google.com/maps/search/?api=1&query={round(h_lat, 5)},{round(h_lon, 5)}"
                    
                    results.append(f"🏥 **{name}**{dist_str}\n📍 {short_addr}\n🔗 {map_url}")
                
                if results:
                    loc_desc = "your current GPS location" if coord_match else location
                    return f"Here are the nearest {facility_type}s around {loc_desc}:\n\n" + "\n\n".join(results) + "\n\nDo you need any guidance on symptoms or first aid while you contact them?"
        except Exception as e:
            print(f"[Geoapify Error] {e}. Falling back to OpenStreetMap...")

    # 2. Fallback to 100% Free OpenStreetMap API (No Key Needed)
    try:
        results = []
        if lat and lon:
            overpass_url = "http://overpass-api.de/api/interpreter"
            query = f"""
            [out:json];
            (
              node["amenity"="{facility_type}"](around:5000,{lat},{lon});
              node["amenity"="hospital"](around:5000,{lat},{lon});
              node["amenity"="clinic"](around:5000,{lat},{lon});
            );
            out center 5;
            """
            res = requests.post(overpass_url, data={'data': query}, timeout=6).json()
            for element in res.get("elements", []):
                tags = element.get("tags", {})
                name = tags.get("name") or f"Local {tags.get('amenity', facility_type).title()}"
                raw_addr = tags.get("addr:full") or tags.get("addr:street") or "Address not listed"
                h_lat = element.get("lat") or element.get("center", {}).get("lat", lat)
                h_lon = element.get("lon") or element.get("center", {}).get("lon", lon)
                
                dist_str = calc_dist(lat, lon, h_lat, h_lon)
                short_addr = clean_addr(name, raw_addr) if raw_addr != "Address not listed" else f"Lat: {round(h_lat, 4)}, Lon: {round(h_lon, 4)}"
                map_url = f"https://www.google.com/maps/search/?api=1&query={round(h_lat, 5)},{round(h_lon, 5)}"
                
                if not any(name in r for r in results):
                    results.append(f"🏥 **{name}**{dist_str}\n📍 {short_addr}\n🔗 {map_url}")
        else:
            osm_url = "https://nominatim.openstreetmap.org/search"
            params = {"q": f"{facility_type} in {location}", "format": "json", "limit": 5, "addressdetails": 1}
            headers = {"User-Agent": "MedibuddyAI/1.0"}
            res = requests.get(osm_url, params=params, headers=headers, timeout=5).json()
            for item in res:
                name = item.get("name") or item.get("display_name", "").split(",")[0]
                raw_addr = item.get("display_name", "Address not available")
                h_lat = float(item["lat"]) if item.get("lat") else None
                h_lon = float(item["lon"]) if item.get("lon") else None
                
                short_addr = clean_addr(name, raw_addr)
                if h_lat is not None and h_lon is not None:
                    map_url = f"https://www.google.com/maps/search/?api=1&query={round(h_lat, 5)},{round(h_lon, 5)}"
                else:
                    map_url = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(name)}"
                results.append(f"🏥 **{name}**\n📍 {short_addr}\n🔗 {map_url}")

            
        if results:
            loc_desc = "your current location" if coord_match else location
            return f"Here are the nearest {facility_type}s around {loc_desc} (via OpenStreetMap):\n\n" + "\n\n".join(results[:5]) + "\n\nDo you need any guidance on symptoms or first aid while you contact them?"
        else:
            return f"I couldn't find any specific {facility_type}s listed near '{location}'. Please try specifying a larger city or area name."
    except Exception as e:
        return f"Unable to fetch nearby healthcare facilities at the moment ({str(e)}). Please search Google Maps for '{facility_type} near {location}'."




