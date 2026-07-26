from fastapi.responses import Response
from xml.etree.ElementTree import Element, tostring

def twiml_message(body: str) -> Response:
    """Create minimal TwiML <Response><Message>...</Message></Response>"""
    response_el = Element('Response')
    message_el = Element('Message')
    message_el.text = body
    response_el.append(message_el)
    xml_bytes = tostring(response_el, encoding='utf-8', xml_declaration=True)
    print(f"📦 [TwiML Generated] XML payload: {xml_bytes.decode('utf-8')}")
    return Response(content=xml_bytes, media_type='text/xml')

