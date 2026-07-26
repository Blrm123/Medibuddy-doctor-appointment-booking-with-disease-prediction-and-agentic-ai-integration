import { NextResponse } from "next/server";

interface DiagnoseRequest {
  imageType: "xray" | "mri" | "ultrasound";
  imageData: string; // base64 image data
}

export interface MedicalReport {
  overview?: string;
  specialist?: string;
  care_plan?: string;
  diet_advice?: string;
  doctor_discussion_topics?: string;
  warning_signs?: string;
}

interface DiagnoseResult {
  prediction: string;
  confidence: number;
  riskLevel?: string;
  specialist?: string;
  report?: MedicalReport;
}

export async function POST(request: Request) {
  try {
    const { imageType, imageData }: DiagnoseRequest = await request.json();

    if (!imageType || !imageData) {
      return NextResponse.json(
        { message: "Image type and data are required" },
        { status: 400 }
      );
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

    // Convert base64 to blob for the backend
    const base64Data = imageData.split(",")[1] || imageData;
    const binaryString = Buffer.from(base64Data, "base64").toString("binary");
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const formData = new FormData();
    const blob = new Blob([bytes], { type: "image/jpeg" });
    formData.append("file", blob, "image.jpg");

    // Call the appropriate unified backend endpoint
    const endpoint = `/predict/${imageType}`;
    const response = await fetch(`${backendUrl}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Fast API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Check if backend returned an error
    if (data.error || !data.prediction || data.confidence === undefined) {
      throw new Error(data.error || "Invalid response from backend: missing prediction or confidence");
    }

    // Determine risk level based on confidence
    const getRiskLevel = (confidence: number) => {
      if (confidence > 0.9) return "High Risk";
      if (confidence > 0.7) return "Moderate Risk";
      return "Low Risk";
    };

    // Get specialist recommendation fallback
    const getSpecialist = (prediction: string) => {
      const specialistMap: { [key: string]: string } = {
        pneumonia: "Pulmonologist",
        covid: "Pulmonologist",
        tuberculosis: "Pulmonologist",
        glioma: "Neurologist / Neurosurgeon",
        meningioma: "Neurologist / Neurosurgeon",
        brain: "Neurologist",
        pituitary: "Endocrinologist",
        "breast cancer": "Oncologist",
        malignant: "Oncologist",
        benign: "General Physician",
        normal: "General Physician",
      };

      for (const [key, value] of Object.entries(specialistMap)) {
        if (prediction.toLowerCase().includes(key)) {
          return value;
        }
      }
      return "General Physician";
    };

    const backendReport = data.report || {};
    const specialist = backendReport.specialist || getSpecialist(data.prediction);

    const result: DiagnoseResult = {
      prediction: data.prediction,
      confidence: data.confidence,
      riskLevel: getRiskLevel(data.confidence),
      specialist: specialist,
      report: backendReport,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error processing image:", errorMessage);
    return NextResponse.json(
      { message: `Failed to process image: ${errorMessage}` },
      { status: 500 }
    );
  }
}
