"use client"

import { useState, useCallback, useEffect } from "react"
import { ModelPalette } from "./ModelPalette"
import { MapCanvas } from "./MapCanvas"
import { PropertyPanel } from "./PropertyPanel"
import { Toolbar } from "./Toolbar"
import { WeatherControl } from "./WeatherControl"
import { useMap } from "@/hooks/useMap"
import { useModels } from "@/hooks/useModels"
import { useMapEditor } from "@/hooks/useMapEditor"
import { useWeather } from "@/hooks/useWeather"
import { useDragDrop } from "@/hooks/useDragDrop"
import { useChatModel } from "@/hooks/useChatModel"
import type { ModelTemplate, Position, MapEditorProps } from "@/types/mapEditor"
import { ResetConfirmDialog } from "./ResetConfirmDialog"
import { encodeSharePayload, createShortLink, buildPlayUrlFromEncoded } from "@/utils/share"
import { toast } from "sonner"

export function MapEditor({ initialMap, onSave, onLoad, isSaving = false }: MapEditorProps) {
  const [showResetDialog, setShowResetDialog] = useState(false)
  const { mapConfig, setMapConfig, pixelToGrid } = useMap(initialMap)
  const { models, addModel, updateModel, removeModel, checkCollision, getCollisionInfo, getCollisionVisualization, undo, redo, reset, canUndo, canRedo } =
    useModels(mapConfig.gridWidth, mapConfig.gridHeight, mapConfig.tileSize)
  const { editorState, setSelectedTool, setSelectedTemplate, setSelectedModel, toggleGrid, toggleCollisions } =
    useMapEditor()
  const { weather, setWeather, initializeWeather, cleanup } = useWeather()
  const { dragState, startDrag, updateDragPosition, endDrag, cancelDrag } = useDragDrop()
  const { openChat, closeChat, isOpen: isChatOpen, currentCharacter, sendMessage, messages, isLoading } = useChatModel()

  const handleStartDrag = useCallback(
    (template: ModelTemplate, startPosition: Position, offset: Position) => {
      startDrag(template, startPosition, offset)
      setSelectedTemplate(template)
    },
    [startDrag, setSelectedTemplate],
  )

  const handleDragOver = useCallback(
    (position: Position) => {
      updateDragPosition(position)
    },
    [updateDragPosition],
  )

  const handleDrop = useCallback(
    (position: Position) => {
      const finalState = endDrag()
      if (finalState.draggedTemplate) {
        handleModelPlace(finalState.draggedTemplate, position)
      }
    },
    [endDrag],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.isDragging) {
        updateDragPosition({ x: e.clientX, y: e.clientY })
      }
    },
    [dragState.isDragging, updateDragPosition],
  )

  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging) {
      cancelDrag()
    }
  }, [dragState.isDragging, cancelDrag])

  // Add global mouse event listeners for drag
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      cleanup() // Cleanup weather effects
    }
  }, [handleMouseMove, handleMouseUp, cleanup])

  const handleModelPlace = useCallback(
    (template: ModelTemplate, position: Position) => {
      const gridPos = pixelToGrid(position)

      // Check for collisions
      if (!checkCollision(gridPos, template.defaultGridSize)) {
        addModel(template, position)
        setSelectedTemplate(null)
      }
    },
    [pixelToGrid, checkCollision, addModel, setSelectedTemplate],
  )

  const handleModelSelect = useCallback(
    (model: any) => {
      setSelectedModel(model)
    },
    [setSelectedModel],
  )

  const handleModelMove = useCallback(
    (modelId: string, position: Position) => {
      const gridPos = pixelToGrid(position)
      updateModel(modelId, { position, gridPosition: gridPos })
    },
    [pixelToGrid, updateModel],
  )

  const handleModelDelete = useCallback(
    (modelId: string) => {
      // 如果要删除的模型正是当前选中的模型，则清除选择
      if (editorState.selectedModel?.id === modelId) {
        setSelectedModel(null)
      }
      removeModel(modelId)
    },
    [editorState.selectedModel?.id, setSelectedModel, removeModel],
  )

  const handleSave = useCallback(() => {
    if (onSave) {
      // 将天气配置同步到mapConfig中再保存
      const updatedMapConfig = {
        ...mapConfig,
        weather: weather.type,  // 将当前天气类型同步到mapConfig
        weatherConfig: weather,
      }
      onSave(models, updatedMapConfig)
    }
  }, [models, mapConfig, weather.type, onSave])

  const handleLoad = useCallback(() => {
    if (onLoad) {
      const { models: loadedModels, mapConfig: loadedConfig } = onLoad()
      setMapConfig(loadedConfig)
      // 恢复天气配置
      if (loadedConfig.weather) {
        setWeather({
          ...weather,
          type: loadedConfig.weather
        })
      }
      // TODO: Load models into useModels hook
    }
  }, [onLoad, setMapConfig, setWeather, weather])

  const handleWeatherInitialize = useCallback(
    (app: any) => {
      initializeWeather(app)
    },
    [initializeWeather],
  )

  const handleReset = useCallback(() => {
    setShowResetDialog(true)
  }, [])

  const handleConfirmReset = useCallback(() => {
    reset()
    setSelectedModel(null)
    setSelectedTemplate(null)
    setSelectedTool("select")
  }, [reset, setSelectedModel, setSelectedTemplate, setSelectedTool])

  const handleShare = useCallback(async () => {
    const tid = toast.loading("正在生成分享链接...")
    try {
      const updatedMapConfig = { ...mapConfig, weather: weather.type, weatherConfig: weather }
      const payload = { name: updatedMapConfig.name, mapConfig: updatedMapConfig, models }
      const encoded = encodeSharePayload(payload)
      // 先尝试短链
      const shortPath = await createShortLink(encoded)
      const url = shortPath ? `${window.location.origin}${shortPath}` : `${window.location.origin}${buildPlayUrlFromEncoded(encoded)}`
      await navigator.clipboard.writeText(url)
      toast.success("分享链接已复制到剪贴板", { id: tid, description: shortPath ? "已使用短链" : "已使用直链" })
    } catch (e: any) {
      toast.error("分享失败", { id: tid, description: e?.message || "请稍后重试" })
    }
  }, [mapConfig, weather.type, models])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="p-4">
        <Toolbar
          editorState={editorState}
          onToolChange={setSelectedTool}
          onToggleGrid={toggleGrid}
          onToggleCollisions={toggleCollisions}
          onSave={handleSave}
          onLoad={handleLoad}
          onUndo={undo}
          onRedo={redo}
          onReset={handleReset}
          onShare={handleShare}
          canUndo={canUndo}
          canRedo={canRedo}
          isSaving={isSaving}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 pt-0 overflow-hidden">
        {/* Left Panel - Model Palette */}
        <ModelPalette
          selectedTemplate={editorState.selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
          onStartDrag={handleStartDrag}
        />

        {/* Center - Map Canvas */}
        <MapCanvas
          mapConfig={mapConfig}
          models={models}
          selectedTemplate={editorState.selectedTemplate}
          selectedModel={editorState.selectedModel}
          selectedTool={editorState.selectedTool}
          showGrid={editorState.showGrid}
          showCollisions={editorState.showCollisions}
          isDragging={dragState.isDragging}
          dragPosition={dragState.currentPosition}
          draggedTemplate={dragState.draggedTemplate}
          weather={weather}
          onModelPlace={handleModelPlace}
          onModelSelect={handleModelSelect}
          onModelMove={handleModelMove}
          onModelDelete={handleModelDelete}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          getCollisionVisualization={getCollisionVisualization}
          getCollisionInfo={getCollisionInfo}
          onWeatherInitialize={handleWeatherInitialize}
        />

        {/* Right Panel */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <PropertyPanel
            selectedModel={editorState.selectedModel}
            onUpdateModel={updateModel}
            onDeleteModel={handleModelDelete}
          />
          <WeatherControl weather={weather} onWeatherChange={setWeather} />
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ResetConfirmDialog
        open={showResetDialog}
        onOpenChange={setShowResetDialog}
        onConfirm={handleConfirmReset}
      />
    </div>
  )
}
