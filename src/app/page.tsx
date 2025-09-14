"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getSavedGames } from "@/utils/storage"
import { MapIcon, EllipsisVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import GameThumbnail from "@/components/GameThumbnail"
import LoadingOverlay from "@/components/LoadingOverlay"

export default function Home() {
  const router = useRouter()
  const [savedGamesCount, setSavedGamesCount] = useState(0)
  const [games, setGames] = useState<any[]>([])
  const [navigatingId, setNavigatingId] = useState<string | null>(null)

  useEffect(() => {
    const loadGameInfo = () => {
      try {
        const list = getSavedGames()
        setGames(list)
        setSavedGamesCount(list.length)
      } catch (error) {
        console.error("加载游戏信息失败:", error)
      }
    }

    loadGameInfo()
  }, [])

  const gotoManage = () => router.push("/manage")
  const gotoChat = () => router.push("/chat")
  const gotoGame = () => router.push("/game")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MapIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  地图集
                </h1>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Avatar>
                    <AvatarFallback>JW</AvatarFallback>
                  </Avatar>
                  <EllipsisVertical className="w-4 h-4 text-gray-500" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={gotoChat}>AI 聊天</DropdownMenuItem>
                <DropdownMenuItem onClick={gotoManage}>管理地图</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* 游戏列表 */}
        {games.length === 0 ? (
          <div className="text-center text-gray-500">暂无保存的游戏，请前往 管理游戏 创建</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games.map((game) => (
              <Card
                key={game.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => { setNavigatingId(game.id); router.push(`/game?id=${encodeURIComponent(game.id)}`) }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {game.name}
                    <Badge variant="outline">{game.mapConfig.width}x{game.mapConfig.height}</Badge>
                  </CardTitle>
                  <CardDescription>创建于: {new Date(game.createdAt).toLocaleString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-3 flex justify-center">
                    <GameThumbnail mapConfig={game.mapConfig} models={game.models} width={320} height={180} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>瓦片大小:</span>
                    <span>{game.mapConfig.tileSize}px</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>对象数量:</span>
                    <span>{game.models.length}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <LoadingOverlay open={!!navigatingId} message="正在打开游戏…" />
    </div>
  )
}
