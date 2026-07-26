"use client";

import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { useChat } from "../hooks/use-chat";

export function ChatContainer() {
  const { prompt, setPrompt, messages, loading, handleSubmit, messagesEndRef, clearHistory } = useChat();

  return (
    <div className="flex flex-col flex-1 h-full bg-background overflow-hidden relative">
      <ChatHeader onClearHistory={clearHistory} />
      <ChatMessages messages={messages} loading={loading} messagesEndRef={messagesEndRef} setPrompt={setPrompt} />
      <ChatInput prompt={prompt} setPrompt={setPrompt} onSubmit={handleSubmit} disabled={loading} />
    </div>
  );
}
