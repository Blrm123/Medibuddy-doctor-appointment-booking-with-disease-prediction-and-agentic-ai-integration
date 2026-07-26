"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  Scan,
  Activity,
  Sparkles,
  FileImage,
  Stethoscope,
  MessageCircle,
  FileText,
  Utensils,
  ShieldAlert,
  HelpCircle,
  Info,
  Calendar,
  ArrowRight,
  UserCheck
} from "lucide-react";
import Image from "next/image";
import { MedicalReport } from "@/app/api/diagnose/route";

interface DiagnosisResult {
  prediction: string;
  confidence: number;
  riskLevel?: string;
  specialist?: string;
  report?: MedicalReport;
}

export default function DiagnosePage() {
  const router = useRouter();
  const [imageType, setImageType] = useState<"xray" | "mri" | "ultrasound">(
    "xray"
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string>("");

  const imageTypeLabels = {
    xray: "X-Ray Scan",
    mri: "MRI Scan",
    ultrasound: "Ultrasound Scan",
  };

  const predictableConditions = {
    xray: [
      { name: "Covid-19", desc: "Lung viral infection screening" },
      { name: "Pneumonia", desc: "Bacterial & viral pulmonary inflammation" },
      { name: "Tuberculosis", desc: "Bacterial lung tissue lesions" },
      { name: "Normal", desc: "Healthy clear lung fields" }
    ],
    mri: [
      { name: "Glioma", desc: "Brain glial tissue tumor classification" },
      { name: "Meningioma", desc: "Meningeal membrane tumor" },
      { name: "Pituitary Tumor", desc: "Pituitary gland mass" },
      { name: "No Tumor", desc: "Healthy brain tissue scan" }
    ],
    ultrasound: [
      { name: "Breast Cancer (Malignant)", desc: "Malignant tissue mass screening" },
      { name: "Benign Mass", desc: "Non-cancerous tissue mass" },
      { name: "Normal", desc: "Healthy breast ultrasound scan" }
    ]
  };

  // Helper mapping findings to doctor specialty booking categories
  const getDoctorSpecialtyInfo = (prediction: string) => {
    const predLower = prediction.toLowerCase();
    
    if (predLower.includes("pneumonia") || predLower.includes("covid") || predLower.includes("tuberculosis")) {
      return {
        category: "Pulmonology",
        title: "Pulmonologist (Lung Specialist)",
        description: "Specialist in respiratory diseases, pulmonary infections, and lung conditions.",
        route: "/doctors/Pulmonology"
      };
    }
    
    if (predLower.includes("glioma") || predLower.includes("meningioma") || predLower.includes("brain")) {
      return {
        category: "Neurology",
        title: "Neurologist & Neurosurgeon",
        description: "Specialist in brain, spinal cord, and central nervous system disorders.",
        route: "/doctors/Neurology"
      };
    }

    if (predLower.includes("pituitary")) {
      return {
        category: "Endocrinology",
        title: "Endocrinologist",
        description: "Specialist in pituitary gland, hormone disorders, and metabolic health.",
        route: "/doctors/Endocrinology"
      };
    }

    if (predLower.includes("malignant") || predLower.includes("cancer")) {
      return {
        category: "Oncology",
        title: "Oncologist (Cancer Specialist)",
        description: "Specialist in cancer diagnosis, oncology treatment, and tissue care.",
        route: "/doctors/Oncology"
      };
    }

    return {
      category: "General Medicine",
      title: "General Physician",
      description: "Primary care physician for comprehensive health evaluations and preventative care.",
      route: "/doctors/General Medicine"
    };
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!selectedImage) {
      setError("Please select an image first");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        body: JSON.stringify({
          imageType,
          imageData: previewUrl,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Diagnosis failed: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process image"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendReportToChatbot = () => {
    if (!result) return;
    
    // Store diagnosis report context into localStorage for chatbot to consume
    const reportData = {
      imageType: imageTypeLabels[imageType],
      prediction: result.prediction,
      confidence: (result.confidence * 100).toFixed(1),
      riskLevel: result.riskLevel,
      specialist: result.specialist,
      report: result.report
    };

    localStorage.setItem("medibuddy_pending_report_context", JSON.stringify(reportData));
    router.push("/chatbot");
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "high risk":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      case "moderate risk":
        return "bg-amber-500/10 border-amber-500/30 text-amber-400";
      case "low risk":
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
      default:
        return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    }
  };

  const affiliatedDoctor = result ? getDoctorSpecialtyInfo(result.prediction) : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background text-foreground pt-20 pb-16 px-4 sm:px-6 lg:px-8 no-scrollbar">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <Scan className="w-5 h-5 text-emerald-400" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold gradient-title tracking-tight">
              Medical Image Diagnosis
            </h1>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            Upload X-rays, MRI scans, or Ultrasounds for deep learning AI medical screening, detailed report generation, and direct doctor booking.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload & Model Capabilities Section */}
          <div className="space-y-6">
            <Card className="bg-card/70 border-border/80 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Select Image Type
                </h2>

                <div className="grid grid-cols-3 gap-3">
                  {(
                    ["xray", "mri", "ultrasound"] as const
                  ).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setImageType(type)}
                      className={`p-3 rounded-xl transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        imageType === type
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/30 font-semibold border border-emerald-400/30"
                          : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50"
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-medium">
                        {imageTypeLabels[type]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Predictable Conditions List */}
              <div className="bg-muted/30 border border-border/60 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Info className="w-3.5 h-3.5" />
                  <span>Detectable Conditions for {imageTypeLabels[imageType]}:</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {predictableConditions[imageType].map((cond, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="bg-card/80 border-emerald-500/20 text-foreground text-xs py-1 px-2.5 rounded-lg flex items-center gap-1"
                      title={cond.desc}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {cond.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* File Upload Dropzone */}
              <div className="border-2 border-dashed border-border/80 rounded-2xl p-8 text-center hover:border-emerald-500/60 bg-muted/20 hover:bg-emerald-500/5 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground block group-hover:text-emerald-400 transition-colors">
                      {selectedImage ? selectedImage.name : `Click to upload ${imageTypeLabels[imageType]}`}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1 block">
                      JPG, PNG, or GIF (max 10MB)
                    </span>
                  </div>
                </label>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5 text-emerald-400" />
                    Selected Scan Preview
                  </p>
                  <div className="relative w-full h-52 rounded-xl overflow-hidden bg-background border border-border">
                    <Image
                      src={previewUrl}
                      alt="Medical scan preview"
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <Alert className="bg-red-500/10 border-red-500/30 text-red-400 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-xs font-medium">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Action Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedImage || loading}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium shadow-md shadow-emerald-950/30 rounded-xl disabled:opacity-50 transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Generating Detailed Medical Report...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Analyze Image & Generate Detailed Report
                  </span>
                )}
              </Button>
            </Card>
          </div>

          {/* Results & LLM Medical Report Section */}
          <div className="space-y-6">
            {result ? (
              <Card className="bg-card/70 border-emerald-500/30 backdrop-blur-xl p-6 rounded-2xl shadow-xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <div>
                      <h2 className="text-lg font-bold text-foreground">
                        Diagnostic Evaluation
                      </h2>
                      <p className="text-xs text-muted-foreground">Generated by AI Medical Specialist Agent</p>
                    </div>
                  </div>
                  <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(result.riskLevel || "")}`}>
                    {result.riskLevel}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {/* Primary Finding & Confidence */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-muted/40 rounded-xl p-4 border border-border/60">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Detected Finding</p>
                      <p className="text-xl font-extrabold text-emerald-400 capitalize tracking-tight">
                        {result.prediction}
                      </p>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-4 border border-border/60">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Confidence Score</p>
                      <p className="text-xl font-extrabold text-foreground">
                        {(result.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Doctor Specialist Recommendation */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Recommended Specialist</p>
                        <p className="text-base font-bold text-emerald-400">
                          {result.report?.specialist || result.specialist}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Affiliated Doctor Appointment Booking Card */}
                  {affiliatedDoctor && (
                    <div className="bg-gradient-to-r from-emerald-950/40 via-card to-teal-950/30 border border-emerald-500/40 rounded-xl p-5 space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-5 h-5 text-emerald-400" />
                          <h4 className="text-sm font-bold text-foreground">
                            Book {affiliatedDoctor.title}
                          </h4>
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[10px]">
                          Affiliated Specialty
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {affiliatedDoctor.description}
                      </p>
                      <Link href={affiliatedDoctor.route} className="block w-full">
                        <Button className="w-full h-10 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-2 shadow-sm">
                          <Calendar className="w-4 h-4" />
                          <span>View Verified {affiliatedDoctor.category} Doctors</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Detailed Clinical Report Sections */}
                  {result.report && (
                    <div className="space-y-3 pt-2">
                      {/* Clinical Overview */}
                      {result.report.overview && (
                        <div className="bg-card/90 rounded-xl p-4 border border-border/60 space-y-1">
                          <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Clinical Overview
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {result.report.overview}
                          </p>
                        </div>
                      )}

                      {/* Care & Lifestyle Plan */}
                      {result.report.care_plan && (
                        <div className="bg-card/90 rounded-xl p-4 border border-border/60 space-y-1">
                          <p className="text-xs font-semibold text-teal-400 flex items-center gap-1.5">
                            <Activity className="w-3.5 h-3.5" />
                            Care & Lifestyle Guidance
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {result.report.care_plan}
                          </p>
                        </div>
                      )}

                      {/* Dietary Advice */}
                      {result.report.diet_advice && (
                        <div className="bg-card/90 rounded-xl p-4 border border-border/60 space-y-1">
                          <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5" />
                            Recommended Diet & Hydration
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {result.report.diet_advice}
                          </p>
                        </div>
                      )}

                      {/* Questions & Medication Topics to Ask Doctor */}
                      {result.report.doctor_discussion_topics && (
                        <div className="bg-card/90 rounded-xl p-4 border border-border/60 space-y-1">
                          <p className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5" />
                            Topics & Medicines to Discuss with Doctor
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {result.report.doctor_discussion_topics}
                          </p>
                        </div>
                      )}

                      {/* Warning Symptoms */}
                      {result.report.warning_signs && (
                        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20 space-y-1">
                          <p className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Warning Symptoms to Watch
                          </p>
                          <p className="text-xs text-red-300 leading-relaxed">
                            {result.report.warning_signs}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transfer to Chatbot Button */}
                  <Button
                    onClick={handleSendReportToChatbot}
                    className="w-full h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold shadow-lg shadow-emerald-950/40 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    <MessageCircle className="w-5 h-5 text-white" />
                    <span>Send Report & Chat with AI Assistant</span>
                  </Button>

                  {/* Disclaimer */}
                  <Alert className="bg-emerald-500/5 border-emerald-500/20 rounded-xl text-muted-foreground">
                    <AlertCircle className="h-4 w-4 text-emerald-400" />
                    <AlertDescription className="text-xs leading-relaxed">
                      This AI report provides guidance for patient education. Always consult your healthcare provider for formal diagnosis and prescription treatments.
                    </AlertDescription>
                  </Alert>
                </div>

                <Button
                  onClick={() => {
                    setSelectedImage(null);
                    setPreviewUrl("");
                    setResult(null);
                  }}
                  variant="outline"
                  className="w-full h-10 border-border text-foreground hover:bg-muted rounded-xl text-xs font-medium"
                >
                  Analyze Another Image
                </Button>
              </Card>
            ) : (
              <Card className="bg-card/40 border-dashed border-border/80 p-8 rounded-2xl flex flex-col items-center justify-center text-center min-h-[380px]">
                <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mb-4">
                  <Scan className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">No Scan Selected</h3>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Select a scan type above to view detectable conditions, then upload an image to generate a detailed medical report and book affiliated doctor appointments.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
