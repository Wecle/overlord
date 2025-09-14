"use client"

import { useState, useCallback, useEffect } from "react"
import { MapEditor } from "@/components/MapEditor/MapEditor"
import { saveGame, updateSavedGame, loadGame, getLatestGame } from "@/utils/storage"
import type { GameModel, MapConfig } from "@/types/mapEditor"
import { ModelCategory, WeatherType } from "@/types/mapEditor"
import { toast } from "sonner"
import LoadingOverlay from "@/components/LoadingOverlay"

export default function ForestMapEditor() {
  const [currentGameId, setCurrentGameId] = useState<string | null>(null)
  const [booting, setBooting] = useState(true)
  const [saving, setSaving] = useState(false)

  // 创建测试数据（如果没有保存的游戏）
  useEffect(() => {
    // 检查是否已有测试数据
    const existingGames = getLatestGame()
    if (!existingGames) {
      console.log("创建测试游戏数据...")
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
        toast.success("已创建测试地图数据")
      } catch (error) {
        console.error("创建测试数据失败:", error)
      }
    }
    // 模拟首次加载/资源准备延迟，真实场景可在PIXI初始化完成后关闭
    const t = setTimeout(() => setBooting(false), 50)
    return () => clearTimeout(t)
  }, [])

  const handleSave = useCallback((models: GameModel[], mapConfig: MapConfig) => {
    setSaving(true)
    try {
      if (currentGameId) {
        // 更新现有游戏
        updateSavedGame(currentGameId, models, mapConfig)
        toast.success("保存成功", {
          description: "地图已更新",
        })
      } else {
        // 保存新游戏
        const gameId = saveGame(models, mapConfig)
        setCurrentGameId(gameId)
        toast.success("保存成功", {
          description: "地图已保存到本地",
        })
      }
    } catch (error) {
      toast.error("保存失败", {
        description: error instanceof Error ? error.message : "保存时发生错误",
      })
    } finally {
      setSaving(false)
    }
  }, [currentGameId])

  const handleLoad = useCallback(() => {
    try {
      const latestGame = getLatestGame()
      if (latestGame) {
        setCurrentGameId(latestGame.id)
        toast.success("加载成功", {
          description: `已加载地图: ${latestGame.name}`,
        })
        return {
          models: latestGame.models,
          mapConfig: latestGame.mapConfig
        }
      } else {
        toast.error("加载失败", {
          description: "没有找到保存的地图",
        })
        return { models: [], mapConfig: {} as MapConfig }
      }
    } catch (error) {
      toast.error("加载失败", {
        description: error instanceof Error ? error.message : "加载时发生错误",
      })
      return { models: [], mapConfig: {} as MapConfig }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <MapEditor
        onSave={handleSave}
        onLoad={handleLoad}
        isSaving={saving}
      />
      <LoadingOverlay open={booting || saving} message={saving ? "正在保存…" : "正在载入编辑器…"} />
    </div>
  )
}
