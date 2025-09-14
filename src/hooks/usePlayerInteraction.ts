import { useCallback, useEffect } from 'react';
import { useKeyboard, type KeyboardConfig } from './useKeyboard';
import type { CharacterModel } from '@/types/mapEditor';

export interface InteractionConfig {
  onQuickDialog?: (character: CharacterModel) => void;
  onOpenChat?: (character: CharacterModel) => void;
  getCurrentCharacter?: () => CharacterModel | null;
  isNearNPC?: () => boolean;
}

export interface PlayerInteractionHookReturn {
  setupInteractionControls: () => void;
  cleanup: () => void;
}

/**
 * 玩家交互控制 Hook
 * 处理与 NPC 的交互按键
 */
export function usePlayerInteraction(config: InteractionConfig): PlayerInteractionHookReturn {
  const { onQuickDialog, onOpenChat, getCurrentCharacter, isNearNPC } = config;
  const { setupKeys, cleanup: cleanupKeyboard } = useKeyboard();

  const doSetup = useCallback(() => {
    const keyboardConfig: KeyboardConfig = {
      interact: {
        code: "KeyE",
        onPress: () => {
          const character = getCurrentCharacter?.();
          if (character && isNearNPC?.()) {
            onQuickDialog?.(character);
          }
        },
      },
      chat: {
        code: "KeyC",
        onPress: () => {
          const character = getCurrentCharacter?.();
          if (character && isNearNPC?.() && character.canDialogue) {
            onOpenChat?.(character);
          }
        },
      },
    };
    setupKeys(keyboardConfig);
  }, [setupKeys, onQuickDialog, onOpenChat, getCurrentCharacter, isNearNPC]);

  const setupInteractionControls = useCallback(() => {
    cleanupKeyboard();
    doSetup();
  }, [cleanupKeyboard, doSetup]);

  useEffect(() => {
    setupInteractionControls()

    return () => cleanupKeyboard();
  }, [setupInteractionControls, cleanupKeyboard]);

  const cleanup = useCallback(() => {
    cleanupKeyboard();
  }, [cleanupKeyboard]);

  return { setupInteractionControls, cleanup };
}
