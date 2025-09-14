"use client"

import { useState, useCallback, useRef } from "react"
import type { ModelTemplate, Position } from "@/types/mapEditor"

interface DragState {
  isDragging: boolean
  draggedTemplate: ModelTemplate | null
  dragOffset: Position
  currentPosition: Position
}

export function useDragDrop() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedTemplate: null,
    dragOffset: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
  })

  const dragImageRef = useRef<HTMLElement | null>(null)

  const startDrag = useCallback(
    (template: ModelTemplate, startPosition: Position, offset: Position = { x: 0, y: 0 }) => {
      setDragState({
        isDragging: true,
        draggedTemplate: template,
        dragOffset: offset,
        currentPosition: startPosition,
      })
    },
    [],
  )

  const updateDragPosition = useCallback((position: Position) => {
    setDragState((prev) => ({
      ...prev,
      currentPosition: position,
    }))
  }, [])

  const endDrag = useCallback(() => {
    const finalState = dragState
    setDragState({
      isDragging: false,
      draggedTemplate: null,
      dragOffset: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
    })
    return finalState
  }, [dragState])

  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedTemplate: null,
      dragOffset: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
    })
  }, [])

  return {
    dragState,
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,
    dragImageRef,
  }
}
