"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSavedGames, getLatestGame } from "@/utils/storage"
import { PlayIcon, PlusIcon, MapIcon } from "lucide-react"
import LoadingOverlay from "@/components/LoadingOverlay"

export default function ManagePage() {
  const router = useRouter()
  const [savedGamesCount, setSavedGamesCount] = useState(0)
  const [latestGameName, setLatestGameName] = useState<string | null>(null)
  const [navigating, setNavigating] = useState<"editor" | "game" | null>(null)

  useEffect(() => {
    const games = getSavedGames()
    setSavedGamesCount(games.length)
    const latest = getLatestGame()
    setLatestGameName(latest?.name || null)
  }, [])

  const gotoEditor = () => { setNavigating("editor"); router.push("/editor") }
  const gotoGame = () => { setNavigating("game"); router.push("/game") }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">地图编辑器
                  <p className="text-sm text-gray-600">创建、编辑和运行您的游戏地图</p>
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">保存的地图</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{savedGamesCount}</div>
              <p className="text-sm text-gray-600 mt-1">个已保存的地图</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">最新地图</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold text-green-600 truncate">{latestGameName || "暂无地图"}</div>
              <p className="text-sm text-gray-600 mt-1">最近编辑的地图</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">状态</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-green-100 text-green-800">系统正常</Badge>
              <p className="text-sm text-gray-600 mt-2">所有功能可用</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200 hover:border-blue-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <PlusIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-blue-900">地图编辑器</CardTitle>
                  <CardDescription>创建和编辑您的游戏地图</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">使用直观的拖拽界面来创建您的游戏世界。添加角色、植物、建筑物，设置天气效果，保存您的作品。</p>
              <div className="flex gap-3">
                <Badge variant="outline">拖拽编辑</Badge>
                <Badge variant="outline">实时预览</Badge>
                <Badge variant="outline">自动保存</Badge>
              </div>
              <Button onClick={gotoEditor} className="w-full mt-6">
                <PlusIcon className="w-4 h-4 mr-2" />
                开始编辑
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200 hover:border-green-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <PlayIcon className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-green-900">游戏运行器</CardTitle>
                  <CardDescription>运行您创建的游戏地图</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">在浏览器中运行您创建的地图。控制角色移动，与游戏世界互动，体验您的创作成果。</p>
              <div className="flex gap-3">
                <Badge variant="outline">实时渲染</Badge>
                <Badge variant="outline">角色控制</Badge>
                <Badge variant="outline">即时运行</Badge>
              </div>
              <Button onClick={gotoGame} className="w-full mt-6" disabled={savedGamesCount === 0}>
                <PlayIcon className="w-4 h-4 mr-2" />
                {savedGamesCount === 0 ? "需要先创建地图" : "开始游戏"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      <LoadingOverlay open={!!navigating} message={navigating === "editor" ? "正在打开编辑器…" : "正在打开游戏…"} />
    </div>
  )
}


