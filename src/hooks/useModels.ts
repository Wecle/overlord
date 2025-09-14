"use client"

import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import {
  type GameModel,
  type ModelTemplate,
  type Position,
  type GridPosition,
  type GridSize,
  type UseModelsReturn,
  type CharacterModel,
  type PlantModel,
  type BuildingModel,
  ModelCategory,
} from "@/types/mapEditor"
import { CollisionDetector, type CollisionResult } from "@/utils/collisionDetection"
import { useHistory } from "./useHistory"
import { AI_PROMPT_TEMPLATES } from "@/constants/modelTemplates"

export function useModels(gridWidth = 32, gridHeight = 24, tileSize = 32): UseModelsReturn {
  const [models, setModels] = useState<GameModel[]>([])
  const { addToHistory, undo, redo, canUndo, canRedo, clearHistory } = useHistory(models)

  const collisionDetector = useMemo(
    () => new CollisionDetector(gridWidth, gridHeight, tileSize),
    [gridWidth, gridHeight, tileSize],
  )

  // 使用 ref 来避免无限循环
  const isUpdatingFromHistoryRef = useRef(false)
  const lastModelsRef = useRef<GameModel[]>([])

  // 仅在实际发生变化时添加到历史记录
  useEffect(() => {
    if (!isUpdatingFromHistoryRef.current &&
        JSON.stringify(models) !== JSON.stringify(lastModelsRef.current)) {
      lastModelsRef.current = models
      if (models.length >= 0) { // 允许空数组
        addToHistory(models)
      }
    }
  }, [models, addToHistory])

  const generateId = useCallback(() => {
    return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }, [])

  const addModel = useCallback(
    (template: ModelTemplate, position: Position): string => {
      const id = generateId()

      const snappedPosition = collisionDetector.snapToGrid(position)
      const gridPosition = collisionDetector.pixelToGrid(snappedPosition)

      let finalId = ""

      setModels((currentModels) => {
        // Check if position is valid before adding
        const collisionResult = collisionDetector.checkCollision(gridPosition, template.defaultGridSize, currentModels)

        if (!collisionResult.validPosition) {
          // Try to find a nearby valid position
          const nearestValid = collisionDetector.findNearestValidPosition(
            gridPosition,
            template.defaultGridSize,
            currentModels,
          )

          if (!nearestValid) {
            console.warn("Cannot place model: no valid position found")
            return currentModels // Return unchanged state
          }

          // Update positions to the nearest valid location
          const validPixelPos = collisionDetector.gridToPixel(nearestValid)
          snappedPosition.x = validPixelPos.x
          snappedPosition.y = validPixelPos.y
          gridPosition.gridX = nearestValid.gridX
          gridPosition.gridY = nearestValid.gridY
        }

        let newModel: GameModel

        switch (template.category) {
          case ModelCategory.CHARACTER:
            const aiPrompt = AI_PROMPT_TEMPLATES[template.id as keyof typeof AI_PROMPT_TEMPLATES] ||
              `你是一个友好的${template.name}，生活在这个村庄里。请用中文回答，保持角色设定。`

            newModel = {
              id,
              name: template.name,
              category: ModelCategory.CHARACTER,
              position: snappedPosition,
              gridPosition,
              size: template.defaultSize,
              gridSize: template.defaultGridSize,
              isPlaced: true,
              characterName: template.name,
              canDialogue: true,
              defaultDialogue: `你好！我是${template.name}。`,
              aiPrompt,
              isInteractable: true,
              templateId: template.id,
            } as CharacterModel
            break

          case ModelCategory.PLANT:
            newModel = {
              id,
              name: template.name,
              category: ModelCategory.PLANT,
              position: snappedPosition,
              gridPosition,
              size: template.defaultSize,
              gridSize: template.defaultGridSize,
              isPlaced: true,
              plantType: template.id,
              growthStage: 3, // Fully grown
              isHarvestable: template.id.includes("berry"),
            } as PlantModel
            break

          case ModelCategory.BUILDING:
            newModel = {
              id,
              name: template.name,
              category: ModelCategory.BUILDING,
              position: snappedPosition,
              gridPosition,
              size: template.defaultSize,
              gridSize: template.defaultGridSize,
              isPlaced: true,
              buildingType: template.id,
              isEnterable: template.id.includes("house") || template.id.includes("shop"),
              capacity: template.id.includes("house") ? 4 : template.id.includes("shop") ? 10 : undefined,
            } as BuildingModel
            break

          default:
            throw new Error(`Unknown model category: ${template.category}`)
        }

        finalId = id
        console.log("Adding model:", newModel) // Debug log
        return [...currentModels, newModel]
      })

      return finalId
    },
    [generateId, collisionDetector], // Removed models from dependency array
  )

  const updateModel = useCallback(
    (id: string, updates: Partial<GameModel>) => {
      setModels((prev) =>
        prev.map((model) => {
          if (model.id !== id) return model

          const updatedModel = { ...model, ...updates } as GameModel

          if (updates.position || updates.gridPosition) {
            let newGridPosition = updatedModel.gridPosition
            let newPosition = updatedModel.position

            // If position was updated, recalculate grid position
            if (updates.position && !updates.gridPosition) {
              newPosition = collisionDetector.snapToGrid(updates.position)
              newGridPosition = collisionDetector.pixelToGrid(newPosition)
            }
            // If grid position was updated, recalculate pixel position
            else if (updates.gridPosition && !updates.position) {
              newPosition = collisionDetector.gridToPixel(updates.gridPosition)
            }

            // Check collision for the new position
            const collisionResult = collisionDetector.checkCollision(
              newGridPosition,
              updatedModel.gridSize,
              prev,
              id, // Exclude current model from collision check
            )

            if (collisionResult.validPosition) {
              updatedModel.position = newPosition
              updatedModel.gridPosition = newGridPosition
            } else {
              console.warn("Cannot move model: position would cause collision")
              // Keep original position
              return model
            }
          }

          return updatedModel
        }),
      )
    },
    [collisionDetector],
  )

  const removeModel = useCallback((id: string) => {
    setModels((prev) => prev.filter((model) => model.id !== id))
  }, [])

  const getModelAt = useCallback(
    (gridPos: GridPosition): GameModel | null => {
      return (
        models.find((model) => {
          const { gridPosition, gridSize } = model
          return (
            gridPos.gridX >= gridPosition.gridX &&
            gridPos.gridX < gridPosition.gridX + gridSize.gridWidth &&
            gridPos.gridY >= gridPosition.gridY &&
            gridPos.gridY < gridPosition.gridY + gridSize.gridHeight
          )
        }) || null
      )
    },
    [models],
  )

  const checkCollision = useCallback(
    (gridPos: GridPosition, gridSize: GridSize, excludeId?: string): boolean => {
      const result = collisionDetector.checkCollision(gridPos, gridSize, models, excludeId)
      return !result.validPosition
    },
    [collisionDetector, models],
  )

  const getCollisionInfo = useCallback(
    (gridPos: GridPosition, gridSize: GridSize, excludeId?: string): CollisionResult => {
      return collisionDetector.checkCollision(gridPos, gridSize, models, excludeId)
    },
    [collisionDetector, models],
  )

  const getCollisionVisualization = useCallback(() => {
    return collisionDetector.getCollisionVisualization(models)
  }, [collisionDetector, models])

  // 撤销操作
  const handleUndo = useCallback(() => {
    const previousModels = undo()
    if (previousModels !== null) {
      isUpdatingFromHistoryRef.current = true
      setModels(previousModels)
      setTimeout(() => {
        isUpdatingFromHistoryRef.current = false
      }, 0)
    }
  }, [undo])

  // 重做操作
  const handleRedo = useCallback(() => {
    const nextModels = redo()
    if (nextModels !== null) {
      isUpdatingFromHistoryRef.current = true
      setModels(nextModels)
      setTimeout(() => {
        isUpdatingFromHistoryRef.current = false
      }, 0)
    }
  }, [redo])

  // 重制操作 - 清空所有模型
  const handleReset = useCallback(() => {
    isUpdatingFromHistoryRef.current = true
    setModels([])
    clearHistory([])
    setTimeout(() => {
      isUpdatingFromHistoryRef.current = false
    }, 0)
  }, [clearHistory])

  return {
    models,
    addModel,
    updateModel,
    removeModel,
    getModelAt,
    checkCollision,
    getCollisionInfo,
    getCollisionVisualization,
    undo: handleUndo,
    redo: handleRedo,
    reset: handleReset,
    canUndo,
    canRedo,
    clearHistory: () => clearHistory(models),
  }
}
