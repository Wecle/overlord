"use client";

import React, { useCallback, useState } from "react";
import { ChatDialog } from "./ChatDialog";
import type { CharacterModel } from "@/types/mapEditor";

interface CharacterChatHandlerProps {
  onClose?: () => void;
  enterDialogueState?: () => void;
  enterExploringState?: () => void;
}

export function useCharacterChatHandler({ onClose, enterDialogueState, enterExploringState }: CharacterChatHandlerProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<CharacterModel | null>(null);
  const [npcNearby, setNpcNearby] = useState(true);

  // 打开AI聊天
  const openChat = useCallback((character: CharacterModel) => {
    setCurrentCharacter(character);
    setIsOpen(true);
    setNpcNearby(true);
    enterDialogueState?.();
  }, [enterDialogueState]);

  // 关闭AI聊天
  const closeChat = useCallback(() => {
    setIsOpen(false);
    setCurrentCharacter(null);
    setNpcNearby(true);
    enterExploringState?.();
    onClose?.();
  }, [enterExploringState, onClose]);

  // 设置NPC是否在附近
  const setNpcNearbyStatus = useCallback((isNearby: boolean) => {
    setNpcNearby(isNearby);
  }, []);

  // 渲染聊天对话框
  const renderChatDialog = useCallback(() => {
    if (!currentCharacter) return null;

    return (
      <ChatDialog
        isOpen={isOpen}
        onClose={closeChat}
        character={currentCharacter}
        npcNearby={npcNearby}
      />
    );
  }, [
    currentCharacter,
    isOpen,
    closeChat,
    npcNearby,
  ]);

  return {
    openChat,
    closeChat,
    isOpen,
    currentCharacter,
    renderChatDialog,
    setNpcNearbyStatus,
    npcNearby,
  };
}

// 用于快速对话的组件
interface QuickDialogProps {
  isVisible: boolean;
  npcName: string;
  dialogText: string;
}

export function QuickDialog({ isVisible, npcName, dialogText }: QuickDialogProps) {
  if (!isVisible) return null;

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 text-white p-4 rounded-lg max-w-md border-2 border-yellow-500">
      <div className="text-yellow-400 font-bold mb-2">
        {npcName}
      </div>
      <div className="text-sm leading-relaxed">
        {dialogText}
      </div>
    </div>
  );
}
