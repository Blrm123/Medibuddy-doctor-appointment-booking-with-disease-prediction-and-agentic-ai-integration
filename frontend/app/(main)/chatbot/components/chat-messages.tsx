import { Loader2, MessageCircle, AlertCircle, Bot, User, Sparkles, ArrowRight, Activity, Calendar, HeartPulse } from "lucide-react";
import { Message } from "../hooks/use-chat";
import { MarkdownMessage } from "@/components/markdown-message";
import { Badge } from "@/components/ui/badge";

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  setPrompt?: (value: string) => void;
}

export function ChatMessages({ messages, loading, messagesEndRef, setPrompt }: ChatMessagesProps) {
  const isEmergencyMessage = (msg: Message) => msg.toolCalled === "emergency_call_tool";

  const quickPrompts = [
    { label: "Book Doctor Appointment", icon: Calendar, text: "How do I book an appointment with a specialist?" },
    { label: "Analyze Medical Symptoms", icon: Activity, text: "I have symptoms of fever and headache, can you advise me?" },
    { label: "Mental Health Support", icon: HeartPulse, text: "I'm feeling overwhelmed today, can we talk?" },
  ];

  return (
    <div className="flex-1 min-h-0 overflow-y-auto w-full pr-1 sm:pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-emerald-500 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-emerald-400 transition-colors">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 py-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/20 to-emerald-400/10 border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-950/40">
                <Bot className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-foreground tracking-tight">How can I support your health today?</h2>
            <p className="text-muted-foreground text-sm max-w-md mt-2 leading-relaxed">
              I am your 24/7 AI Healthcare Assistant. Ask questions, explore medical diagnostics, or get mental health guidance.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-8">
              {quickPrompts.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => setPrompt && setPrompt(item.text)}
                    className="flex flex-col items-start p-4 rounded-2xl bg-card/60 hover:bg-card border border-border/60 hover:border-emerald-500/40 text-left transition-all duration-200 group shadow-xs hover:shadow-md hover:shadow-emerald-950/20"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground mb-1 group-hover:text-emerald-400 transition-colors">
                      {item.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-2">
                      {item.text}
                    </span>
                    <div className="mt-3 flex items-center text-[11px] text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
                      Ask now <ArrowRight className="w-3 h-3 ml-1" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            {msg.sender === "bot" && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                <Bot className="w-4 h-4 text-emerald-400" />
              </div>
            )}

            <div
              className={`max-w-md sm:max-w-xl lg:max-w-2xl px-5 py-4 rounded-2xl shadow-xs transition-all ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs shadow-emerald-950/20 font-medium"
                  : isEmergencyMessage(msg)
                  ? "bg-red-950/40 text-red-100 rounded-tl-xs border border-red-500/40 shadow-lg shadow-red-950/30 backdrop-blur-md"
                  : "bg-card/70 text-foreground rounded-tl-xs border border-border/80 shadow-xs backdrop-blur-md"
              }`}
            >
              {msg.sender === "user" ? (
                <p className="text-sm sm:text-base leading-relaxed">{msg.text}</p>
              ) : (
                <div className="space-y-2">
                  {isEmergencyMessage(msg) && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-red-500/30">
                      <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
                      <span className="font-bold text-red-300 text-sm">Emergency Alert Triggered</span>
                    </div>
                  )}
                  <MarkdownMessage content={msg.text} />
                  {msg.toolCalled && (
                    <div className="pt-2 border-t border-border/40 mt-3">
                      <Badge 
                        variant="outline" 
                        className={`text-[11px] px-2.5 py-0.5 rounded-md font-medium ${
                          isEmergencyMessage(msg)
                            ? "bg-red-500/20 border-red-500/40 text-red-200"
                            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        }`}
                      >
                        {msg.toolCalled === "emergency_call_tool" ? "🚨 Emergency Call Initiated" : `⚡ Tool: ${msg.toolCalled}`}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>

            {msg.sender === "user" && (
              <div className="w-8 h-8 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 mt-1 shadow-xs">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 mt-1 shadow-xs">
              <Bot className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
            <div className="bg-card/70 text-foreground px-5 py-4 rounded-2xl rounded-tl-xs border border-border/80 flex items-center gap-3 backdrop-blur-md">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Assistant is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
