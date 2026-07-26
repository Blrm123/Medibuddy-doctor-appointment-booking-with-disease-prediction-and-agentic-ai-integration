from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from ml_model.predictor import (
    predict_xray,
    predict_mri,
    predict_ultrasound,
    predict_symptoms
)
from agent.medical_agent import generate_detailed_medical_report

router = APIRouter(prefix="/predict", tags=["diagnose"])


class SymptomQuery(BaseModel):
    vector: List[int]


@router.post("/xray")
async def xray_endpoint(file: UploadFile = File(...)):
    """
    X-ray image classification endpoint with detailed medical report.
    """
    try:
        res = predict_xray(file.file)
        report = generate_detailed_medical_report(res["prediction"], res["confidence"], "X-Ray Scan")
        res["report"] = report
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"X-ray prediction error: {str(e)}")


@router.post("/mri")
async def mri_endpoint(file: UploadFile = File(...)):
    """
    MRI image classification endpoint with detailed medical report.
    """
    try:
        res = predict_mri(file.file)
        report = generate_detailed_medical_report(res["prediction"], res["confidence"], "MRI Scan")
        res["report"] = report
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MRI prediction error: {str(e)}")


@router.post("/ultrasound")
async def ultrasound_endpoint(file: UploadFile = File(...)):
    """
    Ultrasound image classification endpoint with detailed medical report.
    """
    try:
        res = predict_ultrasound(file.file)
        report = generate_detailed_medical_report(res["prediction"], res["confidence"], "Ultrasound Scan")
        res["report"] = report
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ultrasound prediction error: {str(e)}")


@router.post("/symptoms")
async def symptoms_endpoint(symptoms: Dict[str, Any]):
    """
    Symptom vector classification endpoint.
    """
    try:
        vector = symptoms.get("vector")
        if not vector:
            raise HTTPException(status_code=400, detail="Missing 'vector' in request body")
        res = predict_symptoms(vector)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Symptom prediction error: {str(e)}")
