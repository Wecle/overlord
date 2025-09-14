import { useCallback, useRef } from 'react';
import { useKeyboard, type KeyboardConfig } from './useKeyboard';
import { useGameStateContext } from '../contexts/GameStateContext';

export interface PlayerVelocity {
  vx: number;
  vy: number;
}

export interface MovementConfig {
  speed: number;
  canMoveTo?: (x: number, y: number) => boolean;
}

export interface PlayerMovementHookReturn {
  velocity: React.MutableRefObject<PlayerVelocity>;
  setupMovementControls: () => void;
  cleanup: () => void;
  updatePosition: (playerRef: React.MutableRefObject<any>) => { moved: boolean; newPosition: { x: number; y: number } };
}

/**
 * 玩家移动控制 Hook
 * 基于速度的移动系统，提供流畅的玩家控制体验
 */
export function usePlayerMovement(config: MovementConfig): PlayerMovementHookReturn {
  const { speed, canMoveTo } = config;
  const { setupKeys, cleanup: cleanupKeyboard, isKeyDown } = useKeyboard();
  const { isMovementEnabled } = useGameStateContext();
  const velocityRef = useRef<PlayerVelocity>({ vx: 0, vy: 0 });

  /**
   * 设置移动控制键
   */
  const setupMovementControls = useCallback(() => {
    const keyboardConfig: KeyboardConfig = {
      // 左移动
      left: {
        code: "ArrowLeft",
        onPress: () => {
          if (isMovementEnabled) {
            velocityRef.current.vx = -speed;
            velocityRef.current.vy = 0;
          }
        },
        onRelease: () => {
          if (isMovementEnabled && !isKeyDown("right") && !isKeyDown("rightAlt") && velocityRef.current.vy === 0) {
            velocityRef.current.vx = 0;
          }
        },
      },
      leftAlt: {
        code: "KeyA",
        onPress: () => {
          if (isMovementEnabled) {
            velocityRef.current.vx = -speed;
            velocityRef.current.vy = 0;
          }
        },
        onRelease: () => {
          if (isMovementEnabled && !isKeyDown("left") && !isKeyDown("right") && !isKeyDown("rightAlt") && velocityRef.current.vy === 0) {
            velocityRef.current.vx = 0;
          }
        },
      },

      // 右移动
      right: {
        code: "ArrowRight",
        onPress: () => {
          if (isMovementEnabled) {
            velocityRef.current.vx = speed;
            velocityRef.current.vy = 0;
          }
        },
        onRelease: () => {
          if (isMovementEnabled && !isKeyDown("left") && !isKeyDown("leftAlt") && velocityRef.current.vy === 0) {
            velocityRef.current.vx = 0;
          }
        },
      },
      rightAlt: {
        code: "KeyD",
        onPress: () => {
          if (isMovementEnabled) {
            velocityRef.current.vx = speed;
            velocityRef.current.vy = 0;
          }
        },
        onRelease: () => {
          if (isMovementEnabled && !isKeyDown("left") && !isKeyDown("leftAlt") && !isKeyDown("right") && velocityRef.current.vy === 0) {
            velocityRef.current.vx = 0;
          }
        },
      },

      // 上移动
      up: {
        code: "ArrowUp",
        onPress: () => {
          if (isMovementEnabled) {
            velocityRef.current.vy = -speed;
            velocityRef.current.vx = 0;
          }
        },
        onRelease: () => {
          if (isMovementEnabled && !isKeyDown("down") && !isKeyDown("downAlt") && velocityRef.current.vx === 0) {
            velocityRef.current.vy = 0;
          }
        },
      },
      upAlt: {
        code: "KeyW",
        onPress: () => {
          if (isMovementEnabled) {
            velocityRef.current.vy = -speed;
            velocityRef.current.vx = 0;
          }
        },
        onRelease: () => {
          if (isMovementEnabled && !isKeyDown("up") && !isKeyDown("down") && !isKeyDown("downAlt") && velocityRef.current.vx === 0) {
            velocityRef.current.vy = 0;
          }
        },
      },

      // 下移动
      down: {
        code: "ArrowDown",
        onPress: () => {
          if (isMovementEnabled) {
            velocityRef.current.vy = speed;
            velocityRef.current.vx = 0;
          }
        },
        onRelease: () => {
          if (isMovementEnabled && !isKeyDown("up") && !isKeyDown("upAlt") && velocityRef.current.vx === 0) {
            velocityRef.current.vy = 0;
          }
        },
      },
      downAlt: {
        code: "KeyS",
        onPress: () => {
          if (isMovementEnabled) {
            velocityRef.current.vy = speed;
            velocityRef.current.vx = 0;
          }
        },
        onRelease: () => {
          if (isMovementEnabled && !isKeyDown("up") && !isKeyDown("upAlt") && !isKeyDown("down") && velocityRef.current.vx === 0) {
            velocityRef.current.vy = 0;
          }
        },
      },
    };

    setupKeys(keyboardConfig);
  }, [speed, setupKeys, isKeyDown, isMovementEnabled]);

  /**
   * 更新玩家位置
   */
  const updatePosition = useCallback((playerRef: React.MutableRefObject<any>) => {
    if (!playerRef.current) {
      return { moved: false, newPosition: { x: 0, y: 0 } };
    }

    const player = playerRef.current;
    const velocity = velocityRef.current;

    // 如果移动被禁用，停止所有移动
    if (!isMovementEnabled) {
      velocityRef.current = { vx: 0, vy: 0 };
      return { moved: false, newPosition: { x: player.x, y: player.y } };
    }

    // 计算新位置
    const newX = player.x + velocity.vx;
    const newY = player.y + velocity.vy;

    let moved = false;

    // 检查 X 轴移动
    if (velocity.vx !== 0) {
      if (!canMoveTo || canMoveTo(newX, player.y)) {
        player.x = newX;
        moved = true;
      }
    }

    // 检查 Y 轴移动
    if (velocity.vy !== 0) {
      if (!canMoveTo || canMoveTo(player.x, newY)) {
        player.y = newY;
        moved = true;
      }
    }

    return {
      moved,
      newPosition: { x: player.x, y: player.y }
    };
  }, [canMoveTo, isMovementEnabled]);

  /**
   * 清理资源
   */
  const cleanup = useCallback(() => {
    cleanupKeyboard();
    velocityRef.current = { vx: 0, vy: 0 };
  }, [cleanupKeyboard]);

  return {
    velocity: velocityRef,
    setupMovementControls,
    cleanup,
    updatePosition,
  };
}
