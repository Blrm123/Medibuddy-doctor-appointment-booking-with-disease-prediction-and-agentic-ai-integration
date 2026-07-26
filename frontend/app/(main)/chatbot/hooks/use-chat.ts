import { useState, FormEvent, useRef, useEffect } from "react";

const CHAT_HISTORY_KEY = "medibuddy_chat_history";
const PENDING_REPORT_KEY = "medibuddy_pending_report_context";

export interface Message {
  text: string;
  sender: "user" | "bot";
  id: string;
  toolCalled?: string;
}

export function useChat() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchBotResponse = async (userPrompt: string, currentHistory: Message[]) => {
    setLoading(true);
    try {
      const historyPayload = currentHistory.map((msg) => ({
        text: msg.text,
        sender: msg.sender,
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: userPrompt,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Network response was not OK (${response.status}): ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      const botMessage: Message = {
        text: data.text,
        sender: "bot" as const,
        id: (Date.now() + 1).toString(),
        toolCalled: data.toolCalled !== "None" ? data.toolCalled : undefined,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Fetch error:", error);
      const errMsg = error instanceof Error ? error.message : "Connection issue";
      setMessages((prev) => [
        ...prev,
        {
          text: `⚠️ ${errMsg}`,
          sender: "bot" as const,
          id: (Date.now() + 1).toString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Load chat history from localStorage on mount and process pending reports
  useEffect(() => {
    if (typeof window !== "undefined") {
      let initialMessages: Message[] = [];
      const savedMessages = localStorage.getItem(CHAT_HISTORY_KEY);
      if (savedMessages) {
        try {
          initialMessages = JSON.parse(savedMessages);
        } catch (error) {
          console.error("Failed to load chat history:", error);
        }
      }

      // Check for pending diagnosis report context sent from Diagnosis page
      const pendingReport = localStorage.getItem(PENDING_REPORT_KEY);
      if (pendingReport) {
        try {
          const reportData = JSON.parse(pendingReport);
          localStorage.removeItem(PENDING_REPORT_KEY);

          const reportPromptText = `I have received my ${reportData.imageType} diagnosis scan report:
- **Scan Type**: ${reportData.imageType}
- **Detected Condition**: ${reportData.prediction} (${reportData.confidence}% confidence)
- **Risk Assessment**: ${reportData.riskLevel || 'N/A'}
- **Recommended Specialist**: ${reportData.specialist || 'General Physician'}
- **Clinical Summary**: ${reportData.report?.overview || 'Scan complete.'}

Please explain this condition in simple terms, recommend a detailed diet & hydration plan, tell me what topics & medicines to discuss with my doctor (${reportData.specialist || 'General Physician'}), and provide recovery precautions.`;

          const userReportMessage: Message = {
            text: reportPromptText,
            sender: "user",
            id: Date.now().toString()
          };

          const updatedMessages = [...initialMessages, userReportMessage];
          setMessages(updatedMessages);
          setIsLoaded(true);

          // Auto-trigger LLM response for the imported report
          fetchBotResponse(reportPromptText, initialMessages);
          return;
        } catch (err) {
          console.error("Failed to parse pending report context:", err);
        }
      }

      setMessages(initialMessages);
      setIsLoaded(true);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    let activePrompt = prompt;
    const lowerPrompt = activePrompt.toLowerCase();

    // Check if user is asking for nearby healthcare without specifying a city
    if (
      typeof window !== "undefined" &&
      "geolocation" in navigator &&
      ["nearest", "nearby", "hospital", "pharmacy", "clinic", "doctor", "where is a"].some((k) => lowerPrompt.includes(k)) &&
      !lowerPrompt.includes("in ") && !lowerPrompt.includes("near ") && !lowerPrompt.includes("at ")
    ) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 6000 });
        });
        const { latitude, longitude } = position.coords;
        activePrompt = `${activePrompt} (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      } catch (err) {
        console.log("Location permission denied or timed out. Sending prompt without GPS coordinates.");
      }
    }

    const messageId = Date.now().toString();
    const userMessage: Message = { text: activePrompt, sender: "user" as const, id: messageId };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setPrompt("");

    await fetchBotResponse(activePrompt, messages);
  };


  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    localStorage.removeItem(PENDING_REPORT_KEY);
  };

  return {
    prompt,
    setPrompt,
    messages,
    loading,
    handleSubmit,
    messagesEndRef,
    clearHistory,
  } as const;
}
