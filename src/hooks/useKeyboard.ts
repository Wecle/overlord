import { useCallback, useRef } from 'react';

export interface KeyboardKey {
  value: string;
  isDown: boolean;
  isUp: boolean;
  press?: () => void;
  release?: () => void;
  unsubscribe: () => void;
}

export interface KeyboardConfig {
  [keyName: string]: {
    code: string;
    onPress?: () => void;
    onRelease?: () => void;
  };
}

/**
 * 基于事件的键盘输入处理 Hook
 * 提供更优雅和可维护的键盘输入管理
 */
export function useKeyboard() {
  const keysRef = useRef<{ [key: string]: KeyboardKey }>({});

  /**
   * 创建单个键盘按键处理器
   */
  const createKey = useCallback((keyCode: string): KeyboardKey => {
    const key: KeyboardKey = {
      value: keyCode,
      isDown: false,
      isUp: true,
      press: undefined,
      release: undefined,
      unsubscribe: () => {},
    };

    // 按键按下处理器
    const downHandler = (event: KeyboardEvent) => {
      if (event.code === key.value) {
        if (key.isUp && key.press) key.press();
        key.isDown = true;
        key.isUp = false;
        event.preventDefault();
      }
    };

    // 按键释放处理器
    const upHandler = (event: KeyboardEvent) => {
      if (event.code === key.value) {
        if (key.isDown && key.release) key.release();
        key.isDown = false;
        key.isUp = true;
        event.preventDefault();
      }
    };

    // 绑定事件监听器
    window.addEventListener("keydown", downHandler, false);
    window.addEventListener("keyup", upHandler, false);

    // 提供清理方法
    key.unsubscribe = () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };

    return key;
  }, []);

  /**
   * 批量创建键盘按键处理器
   */
  const setupKeys = useCallback((config: KeyboardConfig) => {
    const keys: { [keyName: string]: KeyboardKey } = {};

    Object.entries(config).forEach(([keyName, keyConfig]) => {
      const key = createKey(keyConfig.code);
      if (keyConfig.onPress) key.press = keyConfig.onPress;
      if (keyConfig.onRelease) key.release = keyConfig.onRelease;
      keys[keyName] = key;
    });

    keysRef.current = keys;
    return keys;
  }, [createKey]);

  /**
   * 清理所有键盘事件监听器
   */
  const cleanup = useCallback(() => {
    Object.values(keysRef.current).forEach((key) => {
      if (key && key.unsubscribe) {
        key.unsubscribe();
      }
    });
    keysRef.current = {};
  }, []);

  /**
   * 获取指定按键的状态
   */
  const getKeyState = useCallback((keyName: string) => {
    return keysRef.current[keyName];
  }, []);

  /**
   * 检查指定按键是否被按下
   */
  const isKeyDown = useCallback((keyName: string) => {
    const key = keysRef.current[keyName];
    return key ? key.isDown : false;
  }, []);

  return {
    createKey,
    setupKeys,
    cleanup,
    getKeyState,
    isKeyDown,
    keys: keysRef.current,
  };
}
