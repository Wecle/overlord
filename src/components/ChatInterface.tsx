"use client";

import { useChat } from "@ai-sdk/react";
import {
  FormEvent,
  useRef,
  useEffect,
  KeyboardEvent,
  useMemo,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "./ChatMessage";
import { Send, Loader2 } from "lucide-react";

export function ChatInterface({ modelProvider }: { modelProvider: string }) {
  const selectedModelProvider = useMemo(() => modelProvider, [modelProvider]);

  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/chat",
    body: {
      modelProvider: selectedModelProvider,
    },
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = useMemo(
    () => status === "submitted" || status === "streaming",
    [status]
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      if (input.trim()) {
        e.preventDefault();
        const formEvent = new Event("submit", {
          bubbles: true,
          cancelable: true,
        }) as unknown as FormEvent<HTMLFormElement>;
        handleSubmit(formEvent);
      } else {
        toast("Please enter a message first.");
      }
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <div className="flex flex-col h-screen max-w-2xl mx-auto p-4 relative">
        {/* Main Chat Content */}
        <h1 className="text-2xl font-semibold mb-4 text-center">
          PayPal AgentToolkit
        </h1>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-2">
          {messages.map((m) => (
            <ChatMessage
              key={m.id}
              role={m.role as "user" | "assistant" | "system"}
              message={m}
            />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 border-t mt-auto flex items-center justify-between gap-2">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="How can I help... ?"
                className="min-h-[60px]"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
