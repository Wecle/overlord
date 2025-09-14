import { useState, useCallback } from 'react';

/**
 * 游戏状态枚举
 */
export enum GameState {
  EXPLORING = 'exploring',     // 探索状态：可以移动，可以交互
  DIALOGUE = 'dialogue',       // 对话状态：不能移动，可以对话
  CHAT_INPUT = 'chat_input'    // 聊天输入状态：不能移动，可以输入
}

/**
 * 游戏状态管理 Hook
 * 提供全局游戏状态管理，协调不同系统之间的状态切换
 */
export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.EXPLORING);
  const [isMovementEnabled, setIsMovementEnabled] = useState(true);

  /**
   * 进入对话状态
   */
  const enterDialogueState = useCallback(() => {
    setGameState(GameState.DIALOGUE);
    setIsMovementEnabled(false);
  }, []);

  /**
   * 进入聊天输入状态
   */
  const enterChatInputState = useCallback(() => {
    setGameState(GameState.CHAT_INPUT);
    setIsMovementEnabled(false);
  }, []);

  /**
   * 进入探索状态
   */
  const enterExploringState = useCallback(() => {
    setGameState(GameState.EXPLORING);
    setIsMovementEnabled(true);
  }, []);

  /**
   * 手动设置游戏状态
   */
  const setGameStateManual = useCallback((state: GameState) => {
    setGameState(state);
    setIsMovementEnabled(state === GameState.EXPLORING);
  }, []);

  return {
    gameState,
    isMovementEnabled,
    enterDialogueState,
    enterChatInputState,
    enterExploringState,
    setGameState: setGameStateManual
  };
};