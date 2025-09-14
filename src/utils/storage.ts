"use client"

import type { GameModel, MapConfig, WeatherConfig } from "@/types/mapEditor"
import { WeatherType } from "@/types/mapEditor"

export interface SavedGame {
  id: string
  name: string
  models: GameModel[]
  mapConfig: MapConfig
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = "saved_games"

// 获取所有保存的游戏
export function getSavedGames(): SavedGame[] {
  if (typeof window === "undefined") return []

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch (error) {
    console.error("Error loading saved games:", error)
    return []
  }
}

// 保存游戏
export function saveGame(models: GameModel[], mapConfig: MapConfig, name?: string): string {
  if (typeof window === "undefined") return ""

  try {
    const savedGames = getSavedGames()
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const gameName = name || `地图_${new Date().toLocaleString()}`

    // 确保mapConfig有完整的默认值
    const defaultWeatherConfig: WeatherConfig = {
      type: mapConfig.weather || WeatherType.SUNNY,
      intensity: 0.5,
      particleCount: 200,
      windSpeed: 1,
      opacity: 0.8,
    }

    const completeMapConfig: MapConfig = {
      id: mapConfig.id || gameId,
      name: mapConfig.name || gameName,
      width: mapConfig.width || 1024,
      height: mapConfig.height || 768,
      tileSize: mapConfig.tileSize || 32,
      gridWidth: mapConfig.gridWidth || Math.floor((mapConfig.width || 1024) / (mapConfig.tileSize || 32)),
      gridHeight: mapConfig.gridHeight || Math.floor((mapConfig.height || 768) / (mapConfig.tileSize || 32)),
      backgroundType: mapConfig.backgroundType || "grass",
      weather: mapConfig.weather || WeatherType.SUNNY,
      weatherConfig: mapConfig.weatherConfig || defaultWeatherConfig,
    }

    const newGame: SavedGame = {
      id: gameId,
      name: gameName,
      models: JSON.parse(JSON.stringify(models)), // 深拷贝
      mapConfig: completeMapConfig, // 使用完整的配置
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const updatedGames = [...savedGames, newGame]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedGames))

    return gameId
  } catch (error) {
    console.error("Error saving game:", error)
    throw new Error("保存失败")
  }
}

// 更新已保存的游戏
export function updateSavedGame(gameId: string, models: GameModel[], mapConfig: MapConfig, name?: string): void {
  if (typeof window === "undefined") return

  try {
    const savedGames = getSavedGames()
    const gameIndex = savedGames.findIndex(game => game.id === gameId)

    if (gameIndex === -1) {
      throw new Error("游戏不存在")
    }

    // 确保mapConfig有完整的默认值
    const defaultWeatherConfig: WeatherConfig = {
      type: mapConfig.weather || savedGames[gameIndex].mapConfig.weather || WeatherType.SUNNY,
      intensity: 0.5,
      particleCount: 200,
      windSpeed: 1,
      opacity: 0.8,
    }

    const completeMapConfig: MapConfig = {
      id: mapConfig.id || savedGames[gameIndex].mapConfig.id,
      name: mapConfig.name || savedGames[gameIndex].mapConfig.name,
      width: mapConfig.width || 1024,
      height: mapConfig.height || 768,
      tileSize: mapConfig.tileSize || 32,
      gridWidth: mapConfig.gridWidth || Math.floor((mapConfig.width || 1024) / (mapConfig.tileSize || 32)),
      gridHeight: mapConfig.gridHeight || Math.floor((mapConfig.height || 768) / (mapConfig.tileSize || 32)),
      backgroundType: mapConfig.backgroundType || "grass",
      weather: mapConfig.weather || WeatherType.SUNNY,
      weatherConfig: mapConfig.weatherConfig || savedGames[gameIndex].mapConfig.weatherConfig || defaultWeatherConfig,
    }

    savedGames[gameIndex] = {
      ...savedGames[gameIndex],
      models: JSON.parse(JSON.stringify(models)),
      mapConfig: completeMapConfig,
      name: name || savedGames[gameIndex].name,
      updatedAt: new Date().toISOString()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedGames))
  } catch (error) {
    console.error("Error updating saved game:", error)
    throw new Error("更新失败")
  }
}

// 加载游戏
export function loadGame(gameId: string): SavedGame | null {
  if (typeof window === "undefined") return null

  try {
    const savedGames = getSavedGames()
    return savedGames.find(game => game.id === gameId) || null
  } catch (error) {
    console.error("Error loading game:", error)
    return null
  }
}

// 删除游戏
export function deleteGame(gameId: string): void {
  if (typeof window === "undefined") return

  try {
    const savedGames = getSavedGames()
    const filteredGames = savedGames.filter(game => game.id !== gameId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredGames))
  } catch (error) {
    console.error("Error deleting game:", error)
    throw new Error("删除失败")
  }
}

// 获取最新保存的游戏
export function getLatestGame(): SavedGame | null {
  const savedGames = getSavedGames()
  if (savedGames.length === 0) return null

  return savedGames.reduce((latest, current) => {
    return new Date(current.updatedAt) > new Date(latest.updatedAt) ? current : latest
  })
}
