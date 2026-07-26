"use client";

import { MessageCircle, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ChatHeaderProps {
  onClearHistory?: () => void;
}

export function ChatHeader({ onClearHistory }: ChatHeaderProps) {
  return (
    <div className="shrink-0 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl shadow-xs z-10">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner">
                <MessageCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground tracking-tight">MediBuddy Assistant</h1>
                <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-medium">
                  24/7 Active
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">Empowered with Medical Diagnostics & Mental Health AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onClearHistory && (
              <Button
                onClick={onClearHistory}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all rounded-lg text-xs"
                title="Clear chat history"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
