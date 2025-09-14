"use client";

import { useState, useCallback } from "react";
import { useChatService, useCharacterChat } from "@/services/ChatService";
import type { CharacterModel } from "@/types/mapEditor";

// 通用聊天模型接口
export interface UseChatModelReturn {
  openChat: (character: CharacterModel) => void;
  closeChat: () => void;
  isOpen: boolean;
  currentCharacter: CharacterModel | null;
  sendMessage: (message: string) => void;
  messages: any[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 通用聊天模型Hook
 * 基于新的ChatService重构
 */
export function useChatModel(): UseChatModelReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCharacter, setCurrentCharacter] =
    useState<CharacterModel | null>(null);

  // 使用角色聊天服务
  const {
    messages,
    sendMessage: sendChatMessage,
    isLoading,
    error,
  } = useCharacterChat({
    characterName: currentCharacter?.characterName,
    characterPrompt: currentCharacter?.aiPrompt,
  });

  const openChat = useCallback((character: CharacterModel) => {
    setCurrentCharacter(character);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setCurrentCharacter(null);
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      if (currentCharacter && message.trim()) {
        sendChatMessage(message);
      }
    },
    [currentCharacter, sendChatMessage]
  );

  return {
    openChat,
    closeChat,
    isOpen,
    currentCharacter,
    sendMessage,
    messages: messages.filter((m) => m.role !== "system"),
    isLoading,
    error,
  };
}

/**
 * 简化的聊天Hook，用于基本聊天功能
 */
export function useSimpleChat(modelProvider = "doubao") {
  const chatService = useChatService({ modelProvider });

  return {
    ...chatService,
    messages: chatService.messages.filter((m) => m.role !== "system"),
  };
}
