"use client";

import { useChat } from "@ai-sdk/react";
import { Message, type UIMessage } from "ai";
import { useCallback, useState, useRef, useEffect } from "react";

export interface ChatConfig {
  modelProvider?: string;
  systemPrompt?: string;
  characterPrompt?: string;
  apiEndpoint?: string;
  defaultMessages?: UIMessage[];
}

export interface ChatServiceHook {
  messages: UIMessage[];
  input: string;
  isLoading: boolean;
  error: string | null;
  append: (message: Message) => void;
  sendMessage: (message: string) => void;
  clearMessages: () => void;
  handleSubmit: (e: React.FormEvent) => void;
}

/**
 * AI聊天服务Hook
 * 提供统一的聊天功能接口
 */
export function useChatService(config: ChatConfig = {}): ChatServiceHook {
  const {
    modelProvider = "doubao",
    systemPrompt,
    characterPrompt,
    apiEndpoint = "/api/chat",
    defaultMessages,
  } = config;

  const [error, setError] = useState<string | null>(null);

  const {
    messages,
    input,
    status,
    append,
    handleInputChange,
    setMessages,
    handleSubmit,
  } = useChat({
    api: apiEndpoint,
    body: {
      modelProvider,
      systemPrompt,
      characterPrompt,
    },
    initialMessages: defaultMessages,
    onError: (error) => {
      setError(error.message || "聊天发生错误");
      console.error("Chat error:", error);
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  const sendMessage = useCallback(
    (message: string) => {
      setError(null);
      handleInputChange({ target: { value: message } } as any);
    },
    [handleInputChange]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, [setMessages]);

  return {
    messages,
    input,
    isLoading,
    error,
    append,
    sendMessage,
    clearMessages,
    handleSubmit,
  };
}

/**
 * 角色聊天特定的Hook
 * 为游戏角色对话提供特殊处理
 */
export function useCharacterChat({
  characterName,
  characterPrompt,
  defaultMessages,
}: {
  characterName?: string;
  characterPrompt?: string;
  defaultMessages?: string;
}) {
  const config: ChatConfig = {
    modelProvider: "doubao",
    characterPrompt:
      characterPrompt || `你是${characterName}，请以这个角色的身份回答问题。`,
    defaultMessages: defaultMessages
      ? [
          {
            id: "default-message",
            role: "assistant",
            content: defaultMessages,
            parts: [{ type: "text", text: defaultMessages }],
          },
        ]
      : [],
  };

  const chatService = useChatService(config);

  const sendCharacterMessage = useCallback(
    (message: string) => {
      if (!characterName) return;

      chatService.sendMessage(message);
    },
    [characterName, characterPrompt, chatService.sendMessage]
  );

  return {
    ...chatService,
    characterName,
    input: chatService.input,
    append: chatService.append,
    sendMessage: sendCharacterMessage,
    handleSubmit: chatService.handleSubmit,
  };
}
