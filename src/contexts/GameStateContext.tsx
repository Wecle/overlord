"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useGameState, GameState } from '../hooks/useGameState';

interface GameStateContextType {
  gameState: GameState;
  isMovementEnabled: boolean;
  enterDialogueState: () => void;
  enterChatInputState: () => void;
  enterExploringState: () => void;
  setGameState: (state: GameState) => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

interface GameStateProviderProps {
  children: ReactNode;
}

export function GameStateProvider({ children }: GameStateProviderProps) {
  const gameStateValue = useGameState();
  
  return (
    <GameStateContext.Provider value={gameStateValue}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameStateContext() {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameStateContext must be used within a GameStateProvider');
  }
  return context;
}