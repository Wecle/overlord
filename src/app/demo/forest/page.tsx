"use client";

import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X, MessageCircle } from "lucide-react";

interface GameState {
  showDialog: boolean;
  showAIChatDialog: boolean;
  dialogText: string;
  npcName: string;
  isNearNPC: boolean;
}

export default function PixelForestGame() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    showDialog: false,
    showAIChatDialog: false,
    dialogText: "",
    npcName: "",
    isNearNPC: false,
  });

  // AI聊天功能 - 使用默认的模型提供商
  const { messages, input, handleInputChange, handleSubmit, status } = useChat({
    api: "/api/chat",
    body: {
      modelProvider: "doubao", // 使用火山方舟模型
    },
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!canvasRef.current) return;

    const initGame = async () => {
      // 初始化 PIXI 应用
      const app = new PIXI.Application();

      await app.init({
        width: 1024,
        height: 768,
        backgroundColor: 0x2c3e50,
        antialias: false, // 像素风格不需要抗锯齿
      });

      appRef.current = app;
      canvasRef.current!.appendChild(app.canvas);

      // 游戏对象
      let player: PIXI.Graphics;
      let npc: PIXI.Graphics;
      let shop: PIXI.Graphics;
      const trees: PIXI.Graphics[] = [];
      const raindrops: PIXI.Graphics[] = [];

      // 玩家位置和移动
      const playerPos = { x: 100, y: 400 };
      const keys: { [key: string]: boolean } = {};
      const PLAYER_SPEED = 3;
      const TILE_SIZE = 32;

      // 创建像素风格的玩家
      function createPlayer() {
        const player = new PIXI.Graphics();

        // 身体 (蓝色)
        player.beginFill(0x3498db);
        player.drawRect(0, 8, 16, 16);
        player.endFill();

        // 头部 (肉色)
        player.beginFill(0xf4c2a1);
        player.drawRect(4, 0, 8, 8);
        player.endFill();

        // 眼睛
        player.beginFill(0x000000);
        player.drawRect(5, 2, 2, 2);
        player.drawRect(9, 2, 2, 2);
        player.endFill();

        // 腿部
        player.beginFill(0x8b4513);
        player.drawRect(2, 24, 4, 8);
        player.drawRect(10, 24, 4, 8);
        player.endFill();

        player.x = playerPos.x;
        player.y = playerPos.y;
        player.scale.set(2); // 放大像素

        return player;
      }

      // 创建 NPC 杂货商
      function createNPC() {
        const npc = new PIXI.Graphics();

        // 身体 (绿色围裙)
        npc.beginFill(0x27ae60);
        npc.drawRect(0, 8, 16, 16);
        npc.endFill();

        // 头部
        npc.beginFill(0xf4c2a1);
        npc.drawRect(4, 0, 8, 8);
        npc.endFill();

        // 帽子 (棕色)
        npc.beginFill(0x8b4513);
        npc.drawRect(2, 0, 12, 4);
        npc.endFill();

        // 眼睛
        npc.beginFill(0x000000);
        npc.drawRect(5, 2, 2, 2);
        npc.drawRect(9, 2, 2, 2);
        npc.endFill();

        // 胡子
        npc.beginFill(0x95a5a6);
        npc.drawRect(4, 5, 8, 2);
        npc.endFill();

        // 腿部
        npc.beginFill(0x8b4513);
        npc.drawRect(2, 24, 4, 8);
        npc.drawRect(10, 24, 4, 8);
        npc.endFill();

        npc.x = 700;
        npc.y = 350;
        npc.scale.set(2);

        return npc;
      }

      // 创建杂货铺
      function createShop() {
        const shop = new PIXI.Graphics();

        // 屋顶 (红色)
        shop.beginFill(0xe74c3c);
        shop.drawRect(0, 0, 80, 20);
        shop.endFill();

        // 墙壁 (棕色)
        shop.beginFill(0x8b4513);
        shop.drawRect(5, 20, 70, 50);
        shop.endFill();

        // 门 (深棕色)
        shop.beginFill(0x654321);
        shop.drawRect(30, 40, 20, 30);
        shop.endFill();

        // 窗户
        shop.beginFill(0x87ceeb);
        shop.drawRect(10, 30, 12, 12);
        shop.drawRect(58, 30, 12, 12);
        shop.endFill();

        // 招牌
        shop.beginFill(0xf39c12);
        shop.drawRect(15, 10, 50, 8);
        shop.endFill();

        shop.x = 650;
        shop.y = 280;
        shop.scale.set(2);

        return shop;
      }

      // 创建树木
      function createTree(x: number, y: number) {
        const tree = new PIXI.Graphics();

        // 树干
        tree.beginFill(0x8b4513);
        tree.drawRect(6, 16, 4, 16);
        tree.endFill();

        // 树叶 (深绿色)
        tree.beginFill(0x228b22);
        tree.drawRect(0, 0, 16, 20);
        tree.endFill();

        // 树叶细节 (浅绿色)
        tree.beginFill(0x32cd32);
        tree.drawRect(2, 2, 4, 4);
        tree.drawRect(10, 4, 4, 4);
        tree.drawRect(4, 8, 4, 4);
        tree.drawRect(8, 12, 4, 4);
        tree.endFill();

        tree.x = x;
        tree.y = y;
        tree.scale.set(2);

        return tree;
      }

      // 创建雨滴
      function createRaindrop() {
        const drop = new PIXI.Graphics();
        drop.beginFill(0x87ceeb, 0.7);
        drop.drawRect(0, 0, 2, 8);
        drop.endFill();

        drop.x = Math.random() * app.screen.width;
        drop.y = -10;
        drop.scale.set(1);

        return drop;
      }

      // 碰撞检测
      function checkCollision(rect1: any, rect2: any) {
        return (
          rect1.x < rect2.x + rect2.width &&
          rect1.x + rect1.width > rect2.x &&
          rect1.y < rect2.y + rect2.height &&
          rect1.y + rect1.height > rect2.y
        );
      }

      // 检查是否可以移动到指定位置
      function canMoveTo(x: number, y: number) {
        const playerBounds = {
          x: x,
          y: y,
          width: 32, // player.width * scale
          height: 64, // player.height * scale
        };

        // 检查边界
        if (
          x < 0 ||
          x > app.screen.width - 32 ||
          y < 0 ||
          y > app.screen.height - 64
        ) {
          return false;
        }

        // 检查与树木的碰撞
        for (const tree of trees) {
          const treeBounds = {
            x: tree.x,
            y: tree.y,
            width: 32,
            height: 64,
          };
          if (checkCollision(playerBounds, treeBounds)) {
            return false;
          }
        }

        // 检查与商店的碰撞
        const shopBounds = {
          x: shop.x,
          y: shop.y,
          width: 160,
          height: 140,
        };
        if (checkCollision(playerBounds, shopBounds)) {
          return false;
        }

        return true;
      }

      // 检查玩家是否靠近 NPC
      function checkNPCInteraction() {
        const distance = Math.sqrt(
          Math.pow(player.x - npc.x, 2) + Math.pow(player.y - npc.y, 2)
        );

        const isNear = distance < 80;

        // 更新是否靠近NPC的状态
        setGameState(prev => ({ ...prev, isNearNPC: isNear }));

        if (isNear) {
          // E键 - 快速对话
          if (keys["e"] || keys["E"]) {
            showNPCDialog();
          }
          // C键 - AI聊天
          if (keys["c"] || keys["C"]) {
            openAIChat();
          }
        }
      }

      // 显示 NPC 对话
      function showNPCDialog() {
        const dialogs = [
          "欢迎来到我的杂货铺！今天雨下得真大呢。",
          "我这里有各种冒险用品，需要什么吗？",
          "这片森林很神秘，小心那些深处的怪物！",
          "雨天最适合待在室内了，要不要进来坐坐？",
          "我听说森林深处有宝藏，但也很危险...",
        ];

        const randomDialog =
          dialogs[Math.floor(Math.random() * dialogs.length)];

        setGameState(prev => ({
          ...prev,
          showDialog: true,
          dialogText: randomDialog,
          npcName: "杂货商老板",
        }));

        // 3秒后自动关闭对话
        setTimeout(() => {
          setGameState((prev) => ({ ...prev, showDialog: false }));
        }, 3000);
      }

      // 开启AI聊天
      function openAIChat() {
        setGameState(prev => ({ ...prev, showAIChatDialog: true }));
      }

      // 初始化游戏对象
      player = createPlayer();
      npc = createNPC();
      shop = createShop();

      // 创建森林背景
      const background = new PIXI.Graphics();
      background.beginFill(0x1a4d3a); // 深绿色背景
      background.drawRect(0, 0, app.screen.width, app.screen.height);
      background.endFill();

      // 添加草地纹理
      for (let x = 0; x < app.screen.width; x += 16) {
        for (let y = 0; y < app.screen.height; y += 16) {
          if (Math.random() > 0.7) {
            background.beginFill(0x228b22, 0.3);
            background.drawRect(x, y, 4, 4);
            background.endFill();
          }
        }
      }

      app.stage.addChild(background);

      // 创建树木
      const treePositions = [
        [200, 200],
        [300, 150],
        [450, 250],
        [150, 350],
        [400, 400],
        [550, 180],
        [800, 450],
        [900, 200],
        [100, 500],
        [350, 550],
        [750, 550],
        [50, 100],
      ];

      treePositions.forEach(([x, y]) => {
        const tree = createTree(x, y);
        trees.push(tree);
        app.stage.addChild(tree);
      });

      app.stage.addChild(shop);
      app.stage.addChild(npc);
      app.stage.addChild(player);

      // 键盘事件监听
      const handleKeyDown = (e: KeyboardEvent) => {
        keys[e.key.toLowerCase()] = true;
      };

      const handleKeyUp = (e: KeyboardEvent) => {
        keys[e.key.toLowerCase()] = false;
      };

      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);

      // 游戏循环
      app.ticker.add(() => {
        // 玩家移动
        let newX = player.x;
        let newY = player.y;

        if (keys["w"] || keys["arrowup"]) newY -= PLAYER_SPEED;
        if (keys["s"] || keys["arrowdown"]) newY += PLAYER_SPEED;
        if (keys["a"] || keys["arrowleft"]) newX -= PLAYER_SPEED;
        if (keys["d"] || keys["arrowright"]) newX += PLAYER_SPEED;

        // 检查碰撞并移动
        if (canMoveTo(newX, player.y)) {
          player.x = newX;
          playerPos.x = newX;
        }
        if (canMoveTo(player.x, newY)) {
          player.y = newY;
          playerPos.y = newY;
        }

        // 检查 NPC 交互
        checkNPCInteraction();

        // 雨滴效果
        if (Math.random() > 0.85) {
          const drop = createRaindrop();
          raindrops.push(drop);
          app.stage.addChild(drop);
        }

        // 更新雨滴
        raindrops.forEach((drop, index) => {
          drop.y += 8;
          drop.x += Math.sin(drop.y * 0.01) * 0.5; // 轻微摆动

          if (drop.y > app.screen.height) {
            app.stage.removeChild(drop);
            raindrops.splice(index, 1);
          }
        });
      });

      // 清理函数
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        app.destroy(true);
      };
    };

    initGame().catch(console.error);
  }, []);

  // 关闭AI聊天对话框
  const closeAIChat = () => {
    setGameState(prev => ({ ...prev, showAIChatDialog: false }));
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        <div
          ref={canvasRef}
          className="border-2 border-gray-600 rounded-lg overflow-hidden"
        />

        {/* 游戏控制说明 */}
        <div className="absolute top-4 left-4 bg-black/80 text-white p-3 rounded-lg text-sm font-mono">
          <div className="text-green-400 font-bold mb-2">🎮 控制说明</div>
          <div>WASD / 方向键: 移动</div>
          <div>E: 快速对话 (靠近时)</div>
          <div>C: AI聊天 (靠近时)</div>
          {gameState.isNearNPC && (
            <div className="text-yellow-400 mt-2 animate-pulse">
              💬 靠近NPC，可以对话！
            </div>
          )}
        </div>

        {/* NPC 对话框 */}
        {gameState.showDialog && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/90 text-white p-4 rounded-lg max-w-md border-2 border-yellow-500">
            <div className="text-yellow-400 font-bold mb-2">
              {gameState.npcName}
            </div>
            <div className="text-sm leading-relaxed">
              {gameState.dialogText}
            </div>
          </div>
        )}

        {/* 天气效果指示 */}
        <div className="absolute top-4 right-4 bg-blue-900/80 text-white p-3 rounded-lg text-sm font-mono">
          <div className="text-blue-300 font-bold">🌧️ 暴雨天气</div>
          <div className="text-xs mt-1">森林中下着大雨</div>
        </div>

        {/* AI 聊天对话框 */}
        {gameState.showAIChatDialog && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
              {/* 对话框头部 */}
              <div className="flex items-center justify-between p-4 border-b bg-green-600 text-white rounded-t-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  <h3 className="font-bold text-lg">与杂货商艾德温对话</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeAIChat}
                  className="text-white hover:bg-green-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* 聊天消息区域 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
                {messages.filter(m => m.role !== "system").map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-800 border"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="text-green-600 font-semibold text-sm mb-1">
                          杂货商艾德温
                        </div>
                      )}
                      <div className="whitespace-pre-wrap">
                        {message.parts
                          .filter(part => part.type === "text")
                          .map(part => part.text)
                          .join('')
                        }
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg p-3 bg-gray-100 border">
                      <div className="text-green-600 font-semibold text-sm mb-1">
                        杂货商艾德温
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        正在思考...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 输入区域 */}
              <div className="p-4 border-t bg-gray-50 rounded-b-lg">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={handleInputChange}
                    placeholder="和杂货商聊天吧..."
                    className="min-h-[60px] resize-none"
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="self-end bg-green-600 hover:bg-green-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <div className="text-xs text-gray-500 mt-2">
                  按 Ctrl+Enter 快速发送
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
