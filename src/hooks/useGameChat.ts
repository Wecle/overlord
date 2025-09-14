"use client";

import { useCallback, useState } from "react";
import type { CharacterModel } from "@/types/mapEditor";

interface GameChatState {
  showDialog: boolean;
  showAIChatDialog: boolean;
  dialogText: string;
  npcName: string;
  isNearNPC: boolean;
  currentCharacter: CharacterModel | null;
}

export function useGameChat() {
  const [gameState, setGameState] = useState<GameChatState>({
    showDialog: false,
    showAIChatDialog: false,
    dialogText: "",
    npcName: "",
    isNearNPC: false,
    currentCharacter: null,
  });

  // 显示快速对话
  const showQuickDialog = useCallback((character: CharacterModel) => {
    setGameState(prev => ({
      ...prev,
      showDialog: true,
      dialogText: character.defaultDialogue || "你好！",
      npcName: character.characterName,
    }));

    // 3秒后自动关闭对话
    setTimeout(() => {
      setGameState((prev) => ({ ...prev, showDialog: false }));
    }, 3000);
  }, []);

  // 开启AI聊天
  const openAIChat = useCallback((character: CharacterModel) => {
    setGameState(prev => ({
      ...prev,
      showAIChatDialog: true,
      currentCharacter: character
    }));
  }, []);

  // 关闭AI聊天对话框
  const closeAIChat = useCallback(() => {
    setGameState(prev => ({ ...prev, showAIChatDialog: false }));
  }, []);

  // 更新NPC交互状态
  const updateNPCState = useCallback((nearestCharacter: CharacterModel | null) => {
    const isNear = nearestCharacter !== null;

    setGameState(prev => ({
      ...prev,
      isNearNPC: isNear,
      currentCharacter: nearestCharacter,
      npcName: nearestCharacter?.characterName || ""
    }));
  }, []);

  return {
    gameState,
    showQuickDialog,
    openAIChat,
    closeAIChat,
    updateNPCState,
  };
}
