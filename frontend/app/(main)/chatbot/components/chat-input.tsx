import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Sparkles } from "lucide-react";

interface ChatInputProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled: boolean;
}

export function ChatInput({ prompt, setPrompt, onSubmit, disabled }: ChatInputProps) {
  return (
    <div className="shrink-0 w-full border-t border-border/50 bg-background/80 backdrop-blur-xl p-3 sm:p-4 z-10">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={onSubmit} className="relative flex items-center">
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={disabled}
            placeholder="Ask anything about your health, symptoms, or appointments..."
            className="w-full h-12 pl-4 pr-14 text-sm bg-card/80 border-border/80 rounded-2xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-foreground placeholder:text-muted-foreground shadow-inner backdrop-blur-md transition-all"
          />
          <Button
            type="submit"
            size="icon"
            disabled={disabled || !prompt.trim()}
            className="absolute right-1.5 top-1.5 h-9 w-9 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/30 disabled:opacity-40 disabled:hover:from-emerald-600 disabled:hover:to-teal-600 transition-all"
          >
            <Send className="w-4 h-4" />
            <span className="sr-only">Send Message</span>
          </Button>
        </form>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          MediBuddy AI provides information for guidance. Always consult a medical professional for official clinical advice.
        </p>
      </div>
    </div>
  );
}
