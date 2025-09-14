"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import * as PIXI from "pixi.js";
import type { GameModel, MapConfig, CharacterModel } from "@/types/mapEditor";
import { ModelCategory } from "@/types/mapEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RenderUtils } from "@/utils/renderUtils";
import { WeatherType, type WeatherConfig } from "@/types/mapEditor";
import { CollisionDetector } from "@/utils/collisionDetection";
import {
  useCharacterChatHandler,
  QuickDialog,
} from "@/components/chat/CharacterChatHandler";
import { useGameChat } from "@/hooks/useGameChat";
import { usePlayerMovement } from "@/hooks/usePlayerMovement";
import { usePlayerInteraction } from "@/hooks/usePlayerInteraction";
import {
  encodeSharePayload,
  createShortLink,
  buildPlayUrlFromEncoded,
} from "@/utils/share";
import { toast } from "sonner";
import {
  GameStateProvider,
  useGameStateContext,
} from "@/contexts/GameStateContext";
import { OrdersOverlay } from "@/components/OrdersOverlay";

interface GameRunnerProps {
  models: GameModel[];
  mapConfig: MapConfig;
  onExit?: () => void;
  hideUI?: boolean;
  showInfoPanel?: boolean;
}

// 内部游戏内容组件，在GameStateProvider内部使用
function GameContent({
  models,
  mapConfig,
  onExit,
  hideUI = false,
  showInfoPanel = true,
}: GameRunnerProps) {
  const { enterDialogueState, enterExploringState } = useGameStateContext();
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const playerRef = useRef<PIXI.Graphics | null>(null);
  const modelsRef = useRef<{ [id: string]: PIXI.Graphics }>({});
  const isInitializedRef = useRef(false);
  const collisionDetectorRef = useRef<CollisionDetector | null>(null);
  const weatherContainerRef = useRef<PIXI.Container | null>(null);
  const particlesRef = useRef<Array<{ g: PIXI.Graphics; vx: number; vy: number; kind: "rain" | "snow" | "dust" }>>([]);
  const tickerRef = useRef<((ticker: PIXI.Ticker) => void) | null>(null);
  const snowOverlayRef = useRef<PIXI.Graphics | null>(null);
  const dustOverlayRef = useRef<PIXI.Graphics | null>(null);

  const [playerPosition, setPlayerPosition] = useState({ x: 100, y: 100 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // const [backpackOpen, setBackpackOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);

  // 使用游戏聊天逻辑
  const {
    gameState,
    showQuickDialog,
    openAIChat,
    closeAIChat,
    updateNPCState,
  } = useGameChat();

  // 使用角色聊天处理器
  const characterChatHandler = useCharacterChatHandler({
    onClose: closeAIChat,
    enterDialogueState,
    enterExploringState,
  });

  // 检查玩家是否可以移动到指定位置
  const canPlayerMoveTo = useCallback(
    (x: number, y: number) => {
      if (!collisionDetectorRef.current) return true;

      // 玩家尺寸
      const playerWidth = 16 * 2; // 2x缩放
      const playerHeight = 32 * 2; // 2x缩放

      // 地图边界检查（像素级）
      if (
        x < 0 ||
        x + playerWidth > mapConfig.width ||
        y < 0 ||
        y + playerHeight > mapConfig.height
      ) {
        return false;
      }

      // 网格级碰撞检查
      const gridPos = collisionDetectorRef.current.pixelToGrid({ x, y });
      const gridSize = {
        gridWidth: Math.ceil(playerWidth / mapConfig.tileSize),
        gridHeight: Math.ceil(playerHeight / mapConfig.tileSize),
      };
      const gridCollision = collisionDetectorRef.current.checkCollision(
        gridPos,
        gridSize,
        models
      );
      if (!gridCollision.validPosition) return false;

      // 像素级 AABB 碰撞检查，防止与模型重合
      const playerRect = { x, y, width: playerWidth, height: playerHeight };
      const hasPixelOverlap = collisionDetectorRef.current.hasPixelOverlap(
        playerRect,
        models
      );
      if (hasPixelOverlap) return false;

      return true;
    },
    [mapConfig, models]
  );

  // 使用玩家移动控制
  const playerMovement = usePlayerMovement({
    speed: 2,
    canMoveTo: canPlayerMoveTo,
  });

  // 使用玩家交互控制
  const playerInteraction = usePlayerInteraction({
    onQuickDialog: showQuickDialog,
    onOpenChat: characterChatHandler.openChat,
    getCurrentCharacter: () => gameState.currentCharacter,
    isNearNPC: () => gameState.isNearNPC,
  });

  // 更新玩家位置
  const { moved, newPosition } = playerMovement.updatePosition(playerRef);

  // 绑定键盘快捷键：B 打开/关闭背包
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        e.preventDefault()
        setOrdersOpen((v) => !v)
        return
      }
      // 保留原 B 键逻辑处于注释，避免误触
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // 添加调试信息
  useEffect(() => {
    console.log(" GameRunner - 接收到的完整地图配置:", {
      mapConfig: {
        id: mapConfig.id,
        name: mapConfig.name,
        width: mapConfig.width,
        height: mapConfig.height,
        tileSize: mapConfig.tileSize,
        gridWidth: mapConfig.gridWidth,
        gridHeight: mapConfig.gridHeight,
        backgroundType: mapConfig.backgroundType,
        weather: mapConfig.weather,
      },
      modelsCount: models.length,
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        category: m.category,
        position: m.position,
        size: m.size,
      })),
    });
  }, [models, mapConfig]);

  const [gameStats, setGameStats] = useState({
    charactersCount: 0,
    plantsCount: 0,
    buildingsCount: 0,
  });

  // 统计游戏对象
  useEffect(() => {
    const stats = models.reduce(
      (acc, model) => {
        if (model.category === ModelCategory.CHARACTER) acc.charactersCount++;
        else if (model.category === ModelCategory.PLANT) acc.plantsCount++;
        else if (model.category === ModelCategory.BUILDING)
          acc.buildingsCount++;
        return acc;
      },
      { charactersCount: 0, plantsCount: 0, buildingsCount: 0 }
    );
    setGameStats(stats);
  }, [models]);

  // 检查玩家是否靠近可交互角色
  const checkCharacterInteraction = useCallback(() => {
    if (!playerRef.current) return;

    const player = playerRef.current;
    let nearestCharacter: CharacterModel | null = null;
    let minDistance = Infinity;

    // 查找最近的可交互角色
    models.forEach((model) => {
      if (model.category === ModelCategory.CHARACTER) {
        const character = model as CharacterModel;
        if (character.isInteractable) {
          const distance = Math.sqrt(
            Math.pow(player.x - character.position.x, 2) +
              Math.pow(player.y - character.position.y, 2)
          );

          if (distance < 80 && distance < minDistance) {
            minDistance = distance;
            nearestCharacter = character;
          }
        }
      }
    });

    // 更新NPC状态
    updateNPCState(nearestCharacter);
    // 更新聊天框的NPC附近状态
    characterChatHandler.setNpcNearbyStatus(nearestCharacter !== null);
  }, [models, updateNPCState, characterChatHandler.setNpcNearbyStatus]);

  // 游戏循环 - 使用新的移动系统
  const gameLoop = useCallback(() => {
    if (!playerRef.current) return;

    // 更新玩家位置状态
    if (moved) {
      setPlayerPosition(newPosition);
    }

    // 检查角色交互
    checkCharacterInteraction();
  }, [playerMovement, checkCharacterInteraction]);

  // 初始化游戏的 useEffect - 仅在组件挂载和数据准备好后运行
  useEffect(() => {
    // 检查mapConfig是否有效
    if (!mapConfig || !mapConfig.width || !mapConfig.height) {
      console.error(" 无效的mapConfig:", mapConfig);
      setError("地图配置无效");
      setIsLoading(false);
      return;
    }

    console.log(" 数据验证完成，准备初始化游戏...");
    setIsLoading(false); // 先设置为 false，让 DOM 渲染
  }, [mapConfig]);

  // 专门处理 PIXI 应用初始化的 useEffect
  useEffect(() => {
    if (isLoading || error || isInitializedRef.current) {
      console.log(
        " 跳过PIXI初始化 - isLoading:",
        isLoading,
        "error:",
        error,
        "isInitialized:",
        isInitializedRef.current
      );
      return;
    }

    console.log(" useEffect 触发，canvasRef.current:", canvasRef.current);

    if (!canvasRef.current) {
      console.log(" canvasRef.current 仍为 null，DOM 可能还未渲染...");
      return;
    }

    console.log(" 开始初始化 PIXI 应用...");
    isInitializedRef.current = true;

    const initGame = async () => {
      try {
        console.log(" 开始初始化PIXI应用，配置:", mapConfig);
        setError(null);

        // 清理之前的应用
        if (appRef.current) {
          appRef.current.destroy(true, { children: true, texture: true });
          appRef.current = null;
        }

        const app = new PIXI.Application();
        appRef.current = app;

        // 使用共享渲染工具类获取PIXI配置
        const pixiConfig = RenderUtils.getPixiInitConfig(mapConfig);
        await app.init(pixiConfig);

        console.log(" PIXI应用初始化成功");

        if (canvasRef.current) {
          canvasRef.current.innerHTML = "";
          canvasRef.current.appendChild(app.canvas);
          console.log(" 画布已添加到DOM");
        }

        // 创建游戏内容
        createGameContent(app);

        console.log(" 游戏初始化完成！");
      } catch (err) {
        console.error(" 游戏初始化失败:", err);
        setError(`游戏初始化失败: ${err}`);
      }
    };

    initGame();

    return () => {
      console.log(" 清理游戏资源...");

      if (appRef.current) {
        // 移除天气ticker
        const cb = tickerRef.current;
        if (cb && (appRef.current as any).ticker && typeof (appRef.current as any).ticker.remove === "function") {
          ;(appRef.current as any).ticker.remove(cb);
          tickerRef.current = null;
        }

        appRef.current.destroy(true, { children: true, texture: true });
        appRef.current = null;
      }

      // 清理控制系统
      playerMovement.cleanup();
      playerInteraction.cleanup();

      playerRef.current = null;
      modelsRef.current = {};
      collisionDetectorRef.current = null;
      weatherContainerRef.current = null;
      particlesRef.current = [];
      snowOverlayRef.current = null;
      dustOverlayRef.current = null;
      isInitializedRef.current = false;
    };
  }, [isLoading, error, mapConfig]); // 依赖于 isLoading 和 error 状态

  // 额外的 layoutEffect 作为备用方案，在 DOM 布局后立即运行
  useLayoutEffect(() => {
    if (isLoading || error || isInitializedRef.current) {
      return;
    }

    if (canvasRef.current) {
      console.log(" useLayoutEffect - canvasRef.current 已准备好");
    } else {
      console.log(" useLayoutEffect - canvasRef.current 仍为 null");
    }
  }, [isLoading, error]);

  const createGameContent = (app: PIXI.Application) => {
    try {
      // 初始化碰撞检测器
      console.log(" 初始化碰撞检测器...");
      collisionDetectorRef.current = new CollisionDetector(
        mapConfig.gridWidth,
        mapConfig.gridHeight,
        mapConfig.tileSize
      );
      console.log(" 碰撞检测器初始化成功");

      // 使用共享渲染工具类创建背景
      console.log(
        " 创建背景...",
        "背景类型:",
        mapConfig.backgroundType,
        "天气:",
        mapConfig.weather
      );
      const background = RenderUtils.createBackground(mapConfig);
      app.stage.addChild(background);
      const snowOverlay = new PIXI.Graphics();
      snowOverlayRef.current = snowOverlay;
      app.stage.addChild(snowOverlay);
      const dustOverlay = new PIXI.Graphics();
      dustOverlayRef.current = dustOverlay;
      app.stage.addChild(dustOverlay);
      console.log(" 背景创建成功");

      // 创建游戏对象 - 使用共享渲染工具类
      console.log(" 创建游戏对象，数量:", models.length);
      models.forEach((model) => {
        const sprite = RenderUtils.createModelGraphics(model, false);
        modelsRef.current[model.id] = sprite;
        app.stage.addChild(sprite);
        console.log(` 创建游戏对象成功: ${model.name} (${model.category})`);
      });

      // 创建玩家
      console.log(" 创建玩家...");
      const player = RenderUtils.createPlayerGraphics(playerPosition);
      playerRef.current = player;
      app.stage.addChild(player);
      console.log(" 玩家角色创建成功");

      // 设置控制系统
      console.log(" 设置控制系统...");
      playerMovement.setupMovementControls();
      playerInteraction.setupInteractionControls();

      // 天气容器
      const weatherContainer = new PIXI.Container();
      weatherContainerRef.current = weatherContainer;
      app.stage.addChild(weatherContainer);

      // 构建天气粒子
      const cfg: WeatherConfig = mapConfig.weatherConfig || {
        type: mapConfig.weather as any,
        intensity: 0.5,
        particleCount: 200,
        windSpeed: 1,
        opacity: 0.8,
      };

      const buildWeather = () => {
        if (!weatherContainerRef.current) return;
        const container = weatherContainerRef.current;
        container.removeChildren().forEach((c) => c.destroy());
        particlesRef.current = [];
        const width = mapConfig.width;
        const height = mapConfig.height;
        if (snowOverlayRef.current) snowOverlayRef.current.clear();
        if (dustOverlayRef.current) dustOverlayRef.current.clear();

        // draw overlays consistent with editor
        if (cfg.type === WeatherType.SNOWY && snowOverlayRef.current) {
          const overlayAlpha = Math.min(0.5, 0.15 + cfg.intensity * 0.5) * cfg.opacity;
          snowOverlayRef.current.beginFill(0xffffff, overlayAlpha);
          snowOverlayRef.current.drawRect(0, 0, width, height);
          snowOverlayRef.current.endFill();
          for (let i = 0; i < 60; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const r = 4 + Math.random() * 12;
            snowOverlayRef.current.beginFill(0xffffff, 0.05);
            snowOverlayRef.current.drawCircle(x, y, r);
            snowOverlayRef.current.endFill();
          }
        }
        if (cfg.type === WeatherType.DUST && dustOverlayRef.current) {
          const washAlpha = Math.min(0.45, 0.12 + cfg.intensity * 0.4) * cfg.opacity;
          dustOverlayRef.current.beginFill(0xdeb887, washAlpha);
          dustOverlayRef.current.drawRect(0, 0, width, height);
          dustOverlayRef.current.endFill();
          for (let i = 0; i < 50; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const r = 2 + Math.random() * 6;
            dustOverlayRef.current.beginFill(0xd2b48c, 0.05);
            dustOverlayRef.current.drawCircle(x, y, r);
            dustOverlayRef.current.endFill();
          }
        }

        if (cfg.type === WeatherType.RAINY) {
          const count = Math.min(1000, Math.max(50, cfg.particleCount));
          for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics();
            const len = 10 + Math.random() * (16 + cfg.intensity * 24);
            const thickness = 1 + Math.random() * 0.8;
            const alpha = Math.min(1, 0.45 + cfg.opacity * 0.55);
            g.beginFill(0x60a5fa, alpha);
            g.drawRect(0, 0, thickness, len);
            g.endFill();
            g.x = Math.random() * width;
            g.y = Math.random() * height;
            container.addChild(g);

            const vy = 4 + cfg.intensity * 8 + Math.random() * 1.5;
            const vx = cfg.windSpeed * 1.5 + Math.random() * 0.5;
            particlesRef.current.push({ g, vx, vy, kind: "rain" });
          }
        } else if (cfg.type === WeatherType.SNOWY) {
          const count = Math.min(1000, Math.max(50, cfg.particleCount));
          for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics();
            const radius = 1 + Math.random() * 2.2;
            g.beginFill(0xffffff, Math.min(1, 0.6 + cfg.opacity * 0.5));
            g.drawCircle(0, 0, radius);
            g.endFill();
            g.x = Math.random() * width;
            g.y = Math.random() * height;
            container.addChild(g);

            const vy = 0.8 + cfg.intensity * 1.6 + Math.random() * 0.7;
            const vx = (Math.random() - 0.5) * 0.6 + cfg.windSpeed * 0.5;
            particlesRef.current.push({ g, vx, vy, kind: "snow" });
          }
        } else if (cfg.type === WeatherType.DUST) {
          const count = Math.min(1200, Math.max(100, Math.floor(cfg.particleCount * 1.2)));
          for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics();
            const r = Math.random() * 1.2 + 0.4;
            const alpha = 0.15 + cfg.opacity * 0.35;
            const color = 0xd2b48c;
            g.beginFill(color, alpha);
            g.drawCircle(0, 0, r);
            g.endFill();
            g.x = Math.random() * width;
            g.y = Math.random() * height;
            container.addChild(g);

            const vx = 0.6 + cfg.windSpeed * 1.1 + Math.random() * 0.4;
            const vy = (Math.random() - 0.5) * 0.2;
            particlesRef.current.push({ g, vx, vy, kind: "dust" });
          }
        }
      };

      buildWeather();

      const tick = (ticker: PIXI.Ticker) => {
        const width = mapConfig.width;
        const height = mapConfig.height;
        const delta = ticker.deltaTime;
        for (let i = 0; i < particlesRef.current.length; i++) {
          const p = particlesRef.current[i];
          let vx = p.vx;
          let vy = p.vy;

          if (p.kind === "rain") {
            // 已在构建时注入基础速度
          } else if (p.kind === "snow") {
            const drift = Math.sin((p.g.y + p.g.x) * 0.01) * 0.3;
            vx = cfg.windSpeed * 0.5 + drift;
            vy = 0.8 + cfg.intensity * 1.6;
          } else if (p.kind === "dust") {
            vx = 0.6 + cfg.windSpeed * 1.1;
            vy = (Math.random() - 0.5) * 0.02;
          }

          p.g.x += vx * delta;
          p.g.y += vy * delta;
          p.g.alpha = Math.max(0.05, Math.min(1, cfg.opacity));

          if (p.g.y > height + 12) {
            p.g.y = -10;
            p.g.x = Math.random() * width;
          }
          if (p.g.x > width + 12) p.g.x = -10;
          if (p.g.x < -12) p.g.x = width + 10;
        }
      };

      app.ticker.add(gameLoop);
      app.ticker.add(tick);
      tickerRef.current = tick;
      console.log(" 启动游戏循环及天气渲染...");
    } catch (error) {
      console.error(" 创建游戏内容失败:", error);
      throw error;
    }
  };

  const handleShare = useCallback(async () => {
    const tid = toast.loading("正在生成分享链接...");
    try {
      const payload = { name: mapConfig.name, mapConfig, models };
      const encoded = encodeSharePayload(payload);
      const shortPath = await createShortLink(encoded);
      const url = shortPath
        ? `${window.location.origin}${shortPath}`
        : `${window.location.origin}${buildPlayUrlFromEncoded(encoded)}`;
      await navigator.clipboard.writeText(url);
      toast.success("分享链接已复制到剪贴板", {
        id: tid,
        description: shortPath ? "已使用短链" : "已使用直链",
      });
    } catch (e: any) {
      toast.error("分享失败", {
        id: tid,
        description: e?.message || "请稍后重试",
      });
    }
  }, [mapConfig, models]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">加载游戏中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <Button onClick={onExit}>返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* 游戏状态栏 */}
      {!hideUI && (
        <div className="bg-gray-800 p-4 flex justify-between items-center">
          <div className="flex gap-4 text-white">
            <div className="flex items-center gap-2">
              <span>地图:</span>
              <Badge className="text-white" variant="outline">
                {mapConfig.name}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span>尺寸:</span>
              <Badge className="text-white" variant="outline">
                {mapConfig.width}x{mapConfig.height}
              </Badge>
            </div>
          </div>

          <div className="flex gap-4 items-center">
            <div className="flex gap-2 text-white text-sm">
              <Badge variant="secondary">
                角色: {gameStats.charactersCount}
              </Badge>
              <Badge variant="secondary">植物: {gameStats.plantsCount}</Badge>
              <Badge variant="secondary">
                建筑: {gameStats.buildingsCount}
              </Badge>
            </div>
            <Button variant="outline" onClick={handleShare}>
              分享
            </Button>
            <Button variant="outline" onClick={onExit}>
              退出游戏
            </Button>
          </div>
        </div>
      )}

      {/* 游戏画布 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <div
            ref={canvasRef}
            className="border-4 border-green-600 rounded-lg overflow-hidden shadow-2xl"
            style={{ width: mapConfig.width, height: mapConfig.height }}
          />

          {/* 游戏信息面板 */}
          {showInfoPanel && (
            <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
              <div className="text-sm">
                <div>
                  玩家位置: ({Math.round(playerPosition.x)},{" "}
                  {Math.round(playerPosition.y)})
                </div>
                <div className="mt-1 text-xs text-gray-300">
                  使用 ↑ ↓ ← → 或 W A S D 移动
                </div>
                <div className="mt-1 text-xs text-yellow-400">
                  Ctrl / Cmd + B: 打开交易记录
                </div>
                {gameState.isNearNPC && gameState.currentCharacter && (
                  <div className="mt-2 text-yellow-400 animate-pulse">
                    <div>💬 靠近 {gameState.npcName}！</div>
                    <div className="text-xs">
                      E: 对话
                      {gameState.currentCharacter.canDialogue && ` | C: 聊天`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NPC 快速对话框 */}
          {
            <QuickDialog
              isVisible={gameState.showDialog}
              npcName={gameState.npcName}
              dialogText={gameState.dialogText}
            />
          }

          {/* AI 聊天对话框 */}
          {characterChatHandler.renderChatDialog()}

          {/* 手机/背包样式 - 最近30天订单 */}
          <OrdersOverlay open={ordersOpen} onOpenChange={setOrdersOpen} />
        </div>
      </div>
    </div>
  );
}

// 主要的GameRunner组件
export function GameRunner({
  models,
  mapConfig,
  onExit,
  hideUI = false,
  showInfoPanel = true,
}: GameRunnerProps) {
  return (
    <GameStateProvider>
      <GameContent
        models={models}
        mapConfig={mapConfig}
        onExit={onExit}
        hideUI={hideUI}
        showInfoPanel={showInfoPanel}
      />
    </GameStateProvider>
  );
}
