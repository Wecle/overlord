"use client"

import { useState, useCallback } from "react"
import type { MapConfig, Position, GridPosition, GridSize, UseMapReturn } from "@/types/mapEditor"
import { DEFAULT_MAP_CONFIG } from "@/constants/mapConfigs"

export function useMap(initialConfig?: MapConfig): UseMapReturn {
  const [mapConfig, setMapConfig] = useState<MapConfig>(initialConfig || DEFAULT_MAP_CONFIG)

  const gridToPixel = useCallback(
    (gridPos: GridPosition): Position => {
      return {
        x: gridPos.gridX * mapConfig.tileSize,
        y: gridPos.gridY * mapConfig.tileSize,
      }
    },
    [mapConfig.tileSize],
  )

  const pixelToGrid = useCallback(
    (pixelPos: Position): GridPosition => {
      return {
        gridX: Math.floor(pixelPos.x / mapConfig.tileSize),
        gridY: Math.floor(pixelPos.y / mapConfig.tileSize),
      }
    },
    [mapConfig.tileSize],
  )

  const isValidGridPosition = useCallback(
    (gridPos: GridPosition, gridSize: GridSize): boolean => {
      // Check if the position is within map bounds
      if (gridPos.gridX < 0 || gridPos.gridY < 0) return false
      if (gridPos.gridX + gridSize.gridWidth > mapConfig.gridWidth) return false
      if (gridPos.gridY + gridSize.gridHeight > mapConfig.gridHeight) return false

      return true
    },
    [mapConfig.gridWidth, mapConfig.gridHeight],
  )

  return {
    mapConfig,
    setMapConfig,
    gridToPixel,
    pixelToGrid,
    isValidGridPosition,
  }
}
