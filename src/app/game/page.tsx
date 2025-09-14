"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { GameRunner } from "@/components/GameRunner/GameRunner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getLatestGame, getSavedGames, saveGame, deleteGame, type SavedGame } from "@/utils/storage"
import { encodeSharePayload, createShortLink, buildPlayUrlFromEncoded } from "@/utils/share"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"
import type { GameModel, MapConfig } from "@/types/mapEditor"
import { ModelCategory, WeatherType } from "@/types/mapEditor"
import LoadingOverlay from "@/components/LoadingOverlay"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function GamePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedGame, setSelectedGame] = useState<SavedGame | null>(null)
  const [savedGames, setSavedGames] = useState<SavedGame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<SavedGame | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [startingId, setStartingId] = useState<string | null>(null)

  useEffect(() => {
    const loadGames = () => {
      try {
        const games = getSavedGames()
        console.log("游戏页面 - 加载的游戏:", games)
        setSavedGames(games)

        // 如果没有游戏，创建一个测试游戏
        if (games.length === 0) {
          console.log("没有找到保存的游戏，创建测试游戏...")

          const testMapConfig: MapConfig = {
            id: "test_map_1",
            name: "测试地图",
            width: 1024,
            height: 768,
            tileSize: 32,
            gridWidth: 32,
            gridHeight: 24,
            backgroundType: "grass",
            weather: WeatherType.SUNNY
          }

          const testModels: GameModel[] = [
            {
              id: "test_character_1",
              name: "测试角色",
              category: ModelCategory.CHARACTER,
              position: { x: 200, y: 200 },
              gridPosition: { gridX: 6, gridY: 6 },
              size: { width: 32, height: 32 },
              gridSize: { gridWidth: 1, gridHeight: 1 },
              isPlaced: true,
              characterName: "测试NPC",
              canDialogue: true,
              defaultDialogue: "你好！",
              aiPrompt: "你是一个友善的NPC",
              isInteractable: true
            } as any
          ]

          try {
            saveGame(testModels, testMapConfig, "测试地图")
            console.log("测试游戏数据创建成功")
            // 重新加载游戏列表
            const updatedGames = getSavedGames()
            setSavedGames(updatedGames)
          } catch (error) {
            console.error("创建测试数据失败:", error)
          }
        }

        // 若带有 id 参数，则自动进入该存档游戏
        const id = searchParams?.get("id")
        if (id) {
          const list = getSavedGames()
          const found = list.find((g) => g.id === id)
          if (found) {
            setSelectedGame(found)
          }
        }
      } catch (error) {
        console.error("加载游戏列表失败:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadGames()
  }, [searchParams])

  const handleGameSelect = (game: SavedGame) => {
    // 写入URL，便于返回后自动选中
    router.replace(`/game?id=${encodeURIComponent(game.id)}`)
    setSelectedGame(game)
  }

  const handleExitGame = () => {
    setSelectedGame(null)
    setStartingId(null)
    // 退出后移除URL中的id，回到选择列表
    router.replace(`/game`)
  }

  const handleGoHome = () => {
    router.push("/")
  }

  const handleGoEditor = () => {
    router.push("/editor")
  }

  const handleShareGame = async (game: SavedGame) => {
    const tid = toast.loading("正在生成分享链接...")
    try {
      const payload = { name: game.name, mapConfig: game.mapConfig, models: game.models }
      const encoded = encodeSharePayload(payload)
      const shortPath = await createShortLink(encoded)
      const url = shortPath ? `${window.location.origin}${shortPath}` : `${window.location.origin}${buildPlayUrlFromEncoded(encoded)}`
      await navigator.clipboard.writeText(url)
      toast.success("分享链接已复制到剪贴板", { id: tid, description: shortPath ? "已使用短链" : "已使用直链" })
    } catch (err: any) {
      toast.error("分享失败", { id: tid, description: err?.message || "请稍后重试" })
    }
  }

  const handleDeleteGame = (game: SavedGame) => {
    try {
      deleteGame(game.id)
      const updated = getSavedGames()
      setSavedGames(updated)
      toast.success("已删除")
    } catch (e: any) {
      toast.error("删除失败", { description: e?.message || "请稍后重试" })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  // 如果正在运行游戏
  if (selectedGame) {
    return (
      <GameRunner
        models={selectedGame.models}
        mapConfig={selectedGame.mapConfig}
        onExit={handleExitGame}
      />
    )
  }

  // 游戏选择界面
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">地图中心</h1>
          <p className="text-gray-400 mb-6">选择一个保存的地图开始游戏</p>

          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={handleGoHome}>
              返回首页
            </Button>
            <Button onClick={handleGoEditor}>
              创建新地图
            </Button>
            <Button
              onClick={() => {
                // 创建临时测试数据直接启动游戏
                const testGame: SavedGame = {
                  id: "temp_test",
                  name: "临时测试地图",
                  models: [{
                    id: "test_char",
                    name: "测试角色",
                    category: ModelCategory.CHARACTER,
                    position: { x: 200, y: 200 },
                    gridPosition: { gridX: 6, gridY: 6 },
                    size: { width: 32, height: 32 },
                    gridSize: { gridWidth: 1, gridHeight: 1 },
                    isPlaced: true,
                    characterName: "测试NPC",
                    canDialogue: true,
                    defaultDialogue: "你好！",
                    aiPrompt: "你是一个友善的NPC",
                    isInteractable: true
                  } as any],
                  mapConfig: {
                    id: "temp_map",
                    name: "临时地图",
                    width: 1024,
                    height: 768,
                    tileSize: 32,
                    gridWidth: 32,
                    gridHeight: 24,
                    backgroundType: "grass",
                    weather: WeatherType.SUNNY
                  },
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }
                setStartingId("temp_test")
                router.replace(`/game?id=temp_test`)
                setSelectedGame(testGame)
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              🎮 直接测试游戏
            </Button>
          </div>
        </div>

        {savedGames.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>没有保存的地图</CardTitle>
              <CardDescription>
                请先使用地图编辑器创建并保存一个地图
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleGoEditor} className="w-full">
                去创建地图
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedGames.map((game) => (
              <Card
                key={game.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{game.name}</CardTitle>
                    <Badge variant="outline">
                      {game.mapConfig.width}x{game.mapConfig.height}
                    </Badge>
                  </div>
                  <CardDescription>
                    创建于: {new Date(game.createdAt).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>地图尺寸:</span>
                      <span>{game.mapConfig.width} x {game.mapConfig.height}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>瓦片大小:</span>
                      <span>{game.mapConfig.tileSize}px</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>对象数量:</span>
                      <span>{game.models.length}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Badge variant="secondary">
                        角色: {game.models.filter(m => m.category === "character").length}
                      </Badge>
                      <Badge variant="secondary">
                        植物: {game.models.filter(m => m.category === "plant").length}
                      </Badge>
                      <Badge variant="secondary">
                        建筑: {game.models.filter(m => m.category === "building").length}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <Button className="cursor-pointer flex-1" onClick={(e) => { e.stopPropagation(); setStartingId(game.id); handleGameSelect(game) }}>
                      开始游戏
                    </Button>
                    <DropdownMenu open={openMenuId === game.id} onOpenChange={(open) => setOpenMenuId(open ? game.id : null)}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); handleShareGame(game) }}>分享</DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); setPendingDelete(game); setDeleteDialogOpen(true) }}
                        >
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open)
          if (!open) {
            setPendingDelete(null)
            setOpenMenuId(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除？</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete ? `确定要删除「${pendingDelete.name}」吗？此操作不可恢复。` : "确定要删除该地图吗？此操作不可恢复。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setPendingDelete(null); setDeleteDialogOpen(false); setOpenMenuId(null) }}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                if (pendingDelete) {
                  handleDeleteGame(pendingDelete)
                  setPendingDelete(null)
                }
                setDeleteDialogOpen(false)
                setOpenMenuId(null)
              }}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <LoadingOverlay open={!!startingId} message="正在启动游戏…" />
    </div>
  )
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <LoadingOverlay open={true} message="加载中…" />
      }
    >
      <GamePageContent />
    </Suspense>
  )
}
