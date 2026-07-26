import { NextResponse } from "next/server";

interface ChatMessage {
  text: string;
  sender: "user" | "bot";
}

export async function POST(request: Request) {
  try {
    const { prompt, history } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { message: "Prompt is required" },
        { status: 400 }
      );
    }

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    
    let response: Response;
    try {
      response = await fetch(`${backendUrl}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message: prompt,
          history: history || [],
        }),
      });
    } catch (fetchErr) {
      console.error("Backend connection failed:", fetchErr);
      return NextResponse.json(
        { message: "Backend AI server is offline. Please start it using: cd backend && py -3.12 -m uvicorn main:app --port 8000" },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Backend error (${response.status}): ${errText || response.statusText}`);
    }

    const data = await response.json();
    const text = data.response || "I am here to assist you with your health questions.";
    const toolCalled = data.tool_called || "None";

    return NextResponse.json({ text, toolCalled }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error processing chat route:", errorMessage);
    return NextResponse.json(
      { message: errorMessage },
      { status: 500 }
    );
  }
}