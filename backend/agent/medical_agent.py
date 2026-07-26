import os
import sys
import json
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from agent.tools import assess_risk, recommend_specialist
from agent.prompt import MEDICAL_PROMPT, REPORT_SPECIALIST_PROMPT

os.environ["GROQ_API_KEY"] = config.GROQ_API_KEY

llm = ChatGroq(
    model="llama3-8b-8192",
    temperature=0.2,
    api_key=config.GROQ_API_KEY
)

tools = [assess_risk, recommend_specialist]

# Use modern langgraph create_react_agent instead of deprecated initialize_agent
agent_graph = create_react_agent(llm, tools=tools)


def run_medical_agent(disease: str, confidence: float, symptoms: str = "", report: str = "") -> str:
    """
    Summarizes medical condition prediction, risk, specialist recommendation, and next steps.
    """
    prompt = MEDICAL_PROMPT.format(
        disease=disease,
        confidence=confidence,
        symptoms=symptoms,
        report=report
    )
    try:
        inputs = {"messages": [("user", prompt)]}
        response = agent_graph.invoke(inputs)
        messages = response.get("messages", [])
        if messages:
            return str(messages[-1].content)
        return f"Prediction: {disease} (Confidence: {confidence}). Specialist recommended."
    except Exception as e:
        return f"Prediction: {disease} (Confidence: {confidence}). Please consult a general physician for formal medical advice."


def generate_detailed_medical_report(disease: str, confidence: float, scan_type: str = "X-Ray") -> dict:
    """
    Generates a structured medical report using LLM Report Specialist Agent.
    Returns dict with overview, specialist, care_plan, diet_advice, doctor_discussion_topics, warning_signs.
    """
    conf_pct = round(confidence * 100, 1)
    prompt = REPORT_SPECIALIST_PROMPT.format(
        scan_type=scan_type,
        disease=disease,
        confidence_pct=conf_pct
    )
    
    try:
        response = llm.invoke(prompt)
        content = response.content.strip()
        # Clean any accidental markdown codeblock wrapper
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        
        parsed = json.loads(content.strip())
        return parsed
    except Exception as e:
        print(f"[Medical Agent Warning] Failed to generate LLM report ({e}). Using structured fallback report.")
        # Fallback structured report
        return {
            "overview": f"The AI scan analysis detected signs consistent with '{disease}' with a confidence score of {conf_pct}%.",
            "specialist": "General Physician / Relevant Specialist",
            "care_plan": "Ensure adequate rest, monitor body temperature, maintain proper hydration, and avoid strenuous physical exertion.",
            "diet_advice": "Eat easy-to-digest, nutrient-dense foods rich in vitamins C and D. Stay hydrated with warm fluids, soups, and water.",
            "doctor_discussion_topics": "Ask your doctor about diagnostic confirmation, recommended prescription treatment, and expected recovery timeframe.",
            "warning_signs": "Seek immediate emergency medical care if you experience severe shortness of breath, sudden intense pain, or high fever."
        }
