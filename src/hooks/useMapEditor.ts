"use client"

import { useState, useCallback } from "react"
import type { EditorState, ModelTemplate, GameModel } from "@/types/mapEditor"

export function useMapEditor() {
  const [editorState, setEditorState] = useState<EditorState>({
    selectedTool: "select",
    selectedTemplate: null,
    selectedModel: null,
    isPlacing: false,
    showGrid: true,
    showCollisions: false,
  })

  const setSelectedTool = useCallback((tool: EditorState["selectedTool"]) => {
    setEditorState((prev) => ({ ...prev, selectedTool: tool, isPlacing: false }))
  }, [])

  const setSelectedTemplate = useCallback((template: ModelTemplate | null) => {
    setEditorState((prev) => ({
      ...prev,
      selectedTemplate: template,
      selectedTool: template ? "place" : "select",
      isPlacing: !!template,
    }))
  }, [])

  const setSelectedModel = useCallback((model: GameModel | null) => {
    setEditorState((prev) => ({ ...prev, selectedModel: model }))
  }, [])

  const toggleGrid = useCallback(() => {
    setEditorState((prev) => ({ ...prev, showGrid: !prev.showGrid }))
  }, [])

  const toggleCollisions = useCallback(() => {
    setEditorState((prev) => ({ ...prev, showCollisions: !prev.showCollisions }))
  }, [])

  const startPlacing = useCallback(() => {
    setEditorState((prev) => ({ ...prev, isPlacing: true }))
  }, [])

  const stopPlacing = useCallback(() => {
    setEditorState((prev) => ({ ...prev, isPlacing: false }))
  }, [])

  return {
    editorState,
    setSelectedTool,
    setSelectedTemplate,
    setSelectedModel,
    toggleGrid,
    toggleCollisions,
    startPlacing,
    stopPlacing,
  }
}
