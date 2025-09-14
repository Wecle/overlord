"use client"

import { useState, useCallback, useRef } from "react"
import type { GameModel } from "@/types/mapEditor"

interface HistoryState {
  models: GameModel[]
  timestamp: number
}

export function useHistory(initialModels: GameModel[] = []) {
  const [history, setHistory] = useState<HistoryState[]>([
    { models: initialModels, timestamp: Date.now() }
  ])
  const [currentIndex, setCurrentIndex] = useState(0)
  const maxHistorySize = 50 // 限制历史记录大小

  // 添加新的历史状态
  const addToHistory = useCallback((models: GameModel[]) => {
    setHistory(prev => {
      // 检查是否与当前状态相同，避免重复添加
      const currentState = prev[currentIndex]
      if (currentState && JSON.stringify(currentState.models) === JSON.stringify(models)) {
        return prev
      }

      // 如果当前不在最新位置，则删除后面的历史记录
      const newHistory = prev.slice(0, currentIndex + 1)

      // 添加新状态
      const updatedHistory = [
        ...newHistory,
        { models: JSON.parse(JSON.stringify(models)), timestamp: Date.now() }
      ]

      // 限制历史记录大小
      if (updatedHistory.length > maxHistorySize) {
        return updatedHistory.slice(-maxHistorySize)
      }

      return updatedHistory
    })

    setCurrentIndex(prev => {
      return prev + 1
    })
  }, [currentIndex, maxHistorySize])

  // 撤销
  const undo = useCallback((): GameModel[] | null => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      return history[currentIndex - 1].models
    }
    return null
  }, [currentIndex, history])

  // 重做
  const redo = useCallback((): GameModel[] | null => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1)
      return history[currentIndex + 1].models
    }
    return null
  }, [currentIndex, history])

  // 检查是否可以撤销
  const canUndo = currentIndex > 0

  // 检查是否可以重做
  const canRedo = currentIndex < history.length - 1

  // 清空历史记录
  const clearHistory = useCallback((models: GameModel[]) => {
    setHistory([{ models: JSON.parse(JSON.stringify(models)), timestamp: Date.now() }])
    setCurrentIndex(0)
  }, [])

  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: history.length,
    currentIndex
  }
}
