"use client"

import { useEffect, useRef, useState } from "react"
import * as PIXI from "pixi.js"
import { Card } from "@/components/ui/card"
import LoadingOverlay from "@/components/LoadingOverlay"
import type { MapConfig, GameModel, ModelTemplate, Position, WeatherConfig } from "@/types/mapEditor"
import { RenderUtils } from "@/utils/renderUtils"

interface MapCanvasProps {
  mapConfig: MapConfig
  models: GameModel[]
  selectedTemplate: ModelTemplate | null
  selectedModel: GameModel | null
  selectedTool?: "select" | "place" | "delete"
  showGrid: boolean
  showCollisions: boolean
  isDragging: boolean
  dragPosition: Position
  draggedTemplate: ModelTemplate | null
  weather: WeatherConfig
  onModelPlace: (template: ModelTemplate, position: Position) => void
  onModelSelect: (model: GameModel | null) => void
  onModelMove: (modelId: string, position: Position) => void
  onModelDelete?: (modelId: string) => void
  onDragOver: (position: Position) => void
  onDrop: (position: Position) => void
  getCollisionVisualization?: () => {
    occupiedCells: Set<string>
    modelBounds: Array<{ model: GameModel; bounds: any[] }>
  }
  getCollisionInfo?: (gridPos: any, gridSize: any) => { validPosition: boolean; hasCollision: boolean }
  onWeatherInitialize?: (app: PIXI.Application) => void
}

export function MapCanvas({
  mapConfig,
  models,
  selectedTemplate,
  selectedModel,
  selectedTool = "select",
  showGrid,
  showCollisions,
  isDragging,
  dragPosition,
  draggedTemplate,
  weather,
  onModelPlace,
  onModelSelect,
  onModelMove,
  onModelDelete,
  onDragOver,
  onDrop,
  getCollisionVisualization,
  getCollisionInfo,
  onWeatherInitialize,
}: MapCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const gridRef = useRef<PIXI.Graphics | null>(null)
  const modelsContainerRef = useRef<PIXI.Container | null>(null)
  const previewRef = useRef<PIXI.Graphics | null>(null)
  const collisionRef = useRef<PIXI.Graphics | null>(null)
  const backgroundRef = useRef<PIXI.Graphics | null>(null)
  const snowOverlayRef = useRef<PIXI.Graphics | null>(null)
  const dustOverlayRef = useRef<PIXI.Graphics | null>(null)
  const weatherContainerRef = useRef<PIXI.Container | null>(null)
  const particlesRef = useRef<Array<{ g: PIXI.Graphics; vx: number; vy: number; kind: "rain" | "snow" | "cloud" | "dust"; baseY?: number; phase?: number; amp?: number }>>([])
  const lightningContainerRef = useRef<PIXI.Container | null>(null)
  const lightningFlashRef = useRef<PIXI.Graphics | null>(null)
  const lightningBoltRef = useRef<PIXI.Graphics | null>(null)
  const lightningCooldownRef = useRef<number>(0)
  const modelsRef = useRef<GameModel[]>(models) // 存储最新的 models 值
  const selectedToolRef = useRef(selectedTool) // 存储最新的 selectedTool 值
  const selectedTemplateRef = useRef(selectedTemplate) // 存储最新的 selectedTemplate 值
  const isDraggingRef = useRef(isDragging) // 存储最新的 isDragging 值
  const weatherRef = useRef<WeatherConfig>(weather)
  const tickerRef = useRef<((ticker: PIXI.Ticker) => void) | null>(null)
  const timeRef = useRef<number>(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // 更新 ref 的值
  useEffect(() => {
    modelsRef.current = models
  }, [models])

  useEffect(() => {
    selectedToolRef.current = selectedTool
  }, [selectedTool])

  useEffect(() => {
    selectedTemplateRef.current = selectedTemplate
  }, [selectedTemplate])

  useEffect(() => {
    isDraggingRef.current = isDragging
  }, [isDragging])

  useEffect(() => {
    weatherRef.current = weather
  }, [weather])

  useEffect(() => {
    if (!canvasRef.current || appRef.current) return

    const initCanvas = async () => {
      try {
        const app = new PIXI.Application()
        // 使用共享渲染工具类获取PIXI配置
        const pixiConfig = RenderUtils.getPixiInitConfig(mapConfig)
        await app.init(pixiConfig)

        // Clear any existing canvas elements first
        if (canvasRef.current) {
          canvasRef.current.innerHTML = ""
        }

        appRef.current = app
        canvasRef.current!.appendChild(app.canvas)

        // 使用共享渲染工具类创建背景
        const background = RenderUtils.createBackground(mapConfig)
        backgroundRef.current = background
        app.stage.addChild(background)

        // Create grid
        const grid = new PIXI.Graphics()
        gridRef.current = grid
        app.stage.addChild(grid)

        const collision = new PIXI.Graphics()
        collisionRef.current = collision
        app.stage.addChild(collision)

        // Snow ground overlay (just above background, below grid)
        const snowOverlay = new PIXI.Graphics()
        snowOverlayRef.current = snowOverlay
        app.stage.addChildAt(snowOverlay, 1)

        // Dust overlay (color wash), above snow overlay
        const dustOverlay = new PIXI.Graphics()
        dustOverlayRef.current = dustOverlay
        app.stage.addChildAt(dustOverlay, 2)

        // Create models container
        const modelsContainer = new PIXI.Container()
        modelsContainerRef.current = modelsContainer
        app.stage.addChild(modelsContainer)

        // Create preview container
        const preview = new PIXI.Graphics()
        previewRef.current = preview
        app.stage.addChild(preview)

        // Weather/precipitation overlay container (near top visual layer)
        const weatherContainer = new PIXI.Container()
        weatherContainerRef.current = weatherContainer
        app.stage.addChild(weatherContainer)

        // Lightning effects (flash + bolt) on the very top
        const lightningContainer = new PIXI.Container()
        lightningContainerRef.current = lightningContainer
        app.stage.addChild(lightningContainer)

        const lightningFlash = new PIXI.Graphics()
        lightningFlashRef.current = lightningFlash
        lightningContainer.addChild(lightningFlash)

        const lightningBolt = new PIXI.Graphics()
        lightningBoltRef.current = lightningBolt
        lightningContainer.addChild(lightningBolt)

        if (onWeatherInitialize) {
          onWeatherInitialize(app)
        }

        app.stage.eventMode = "static"
        app.stage.on("pointerdown", (event) => {
          const position = event.global
          const pixelPos: Position = { x: position.x, y: position.y }

          if (isDraggingRef.current) return

          // Handle different tool modes
          switch (selectedToolRef.current) {
            case "place":
              if (selectedTemplateRef.current) {
                onModelPlace(selectedTemplateRef.current, pixelPos)
              }
              break
            case "delete":
              const modelToDelete = modelsRef.current.find((model) => {
                // Account for the 2x scaling applied to model graphics
                const scaledWidth = (model.size.width / 2) * 2
                const scaledHeight = (model.size.height / 2) * 2

                return (
                  pixelPos.x >= model.position.x &&
                  pixelPos.x <= model.position.x + scaledWidth &&
                  pixelPos.y >= model.position.y &&
                  pixelPos.y <= model.position.y + scaledHeight
                )
              })
              if (modelToDelete && onModelDelete) {
                onModelDelete(modelToDelete.id)
              }
              break
            case "select":
            default:
              const clickedModel = modelsRef.current.find((model) => {
                // Account for the 2x scaling applied to model graphics
                const scaledWidth = (model.size.width / 2) * 2
                const scaledHeight = (model.size.height / 2) * 2

                return (
                  pixelPos.x >= model.position.x &&
                  pixelPos.x <= model.position.x + scaledWidth &&
                  pixelPos.y >= model.position.y &&
                  pixelPos.y <= model.position.y + scaledHeight
                )
              })
              onModelSelect(clickedModel || null)
              break
          }
        })

        // Handle drag over
        app.stage.on("pointermove", (event) => {
          if (isDraggingRef.current) {
            const position = event.global
            const pixelPos: Position = { x: position.x, y: position.y }
            onDragOver(pixelPos)
          }
        })

        setIsInitialized(true)
      } catch (error) {
        console.error("Failed to initialize PIXI:", error)
      }
    }

    initCanvas()

    return () => {
      // remove ticker callback safely before destroying app
      const cb = tickerRef.current
      const appInstance = appRef.current
      if (cb && appInstance && (appInstance as any).ticker && typeof (appInstance as any).ticker.remove === "function") {
        ;(appInstance as any).ticker.remove(cb)
        tickerRef.current = null
      }

      if (appRef.current) {
        // Clear the container before destroying
        if (canvasRef.current) {
          canvasRef.current.innerHTML = ""
        }
        appRef.current.destroy(true, { children: true, texture: true })
        appRef.current = null
      }
      setIsInitialized(false)
    }
  }, [mapConfig.width, mapConfig.height]) // Only depend on map dimensions

  useEffect(() => {
    if (!appRef.current || !isInitialized) return

    // Update canvas size if needed
    if (appRef.current.screen.width !== mapConfig.width || appRef.current.screen.height !== mapConfig.height) {
      appRef.current.renderer.resize(mapConfig.width, mapConfig.height)
    }
  }, [mapConfig.width, mapConfig.height, isInitialized])

  // 构建或重建降水粒子（随天气类型/数量变化）
  useEffect(() => {
    if (!isInitialized || !appRef.current || !weatherContainerRef.current) return

    const container = weatherContainerRef.current
    // 清除旧粒子
    container.removeChildren().forEach((c) => c.destroy())
    particlesRef.current = []

    if (weather.type === "sunny" || weather.particleCount <= 0) return

    const width = mapConfig.width
    const height = mapConfig.height
    const count = Math.min(Math.max(weather.particleCount, 10), 800)

    if (weather.type === "rainy") {
      for (let i = 0; i < count; i++) {
        const g = new PIXI.Graphics()
        const len = 10 + Math.random() * (16 + weather.intensity * 24)
        const thickness = 1 + Math.random() * 0.8
        const alpha = Math.min(1, 0.45 + weather.opacity * 0.55)
        g.beginFill(0x60a5fa, alpha)
        g.drawRect(0, 0, thickness, len)
        g.endFill()
        g.x = Math.random() * width
        g.y = Math.random() * height
        container.addChild(g)

        const vy = 4 + weather.intensity * 8 + Math.random() * 1.5
        const vx = weather.windSpeed * 1.5 + Math.random() * 0.5
        particlesRef.current.push({ g, vx, vy, kind: "rain" })
      }
    } else if (weather.type === "snowy") {
      for (let i = 0; i < count; i++) {
        const g = new PIXI.Graphics()
        const radius = 1 + Math.random() * 2.2
        g.beginFill(0xffffff, Math.min(1, 0.6 + weather.opacity * 0.5))
        g.drawCircle(0, 0, radius)
        g.endFill()
        g.x = Math.random() * width
        g.y = Math.random() * height
        container.addChild(g)

        const vy = 0.8 + weather.intensity * 1.6 + Math.random() * 0.7
        const vx = (Math.random() - 0.5) * 0.6 + weather.windSpeed * 0.5
        particlesRef.current.push({ g, vx, vy, kind: "snow" })
      }
    } else if (weather.type === "dust") {
      const dustCount = Math.min(1000, Math.floor(count * 1.2))
      for (let i = 0; i < dustCount; i++) {
        const g = new PIXI.Graphics()
        const r = Math.random() * 1.2 + 0.4
        const alpha = 0.15 + weather.opacity * 0.35
        const color = 0xd2b48c // tan
        g.beginFill(color, alpha)
        g.drawCircle(0, 0, r)
        g.endFill()
        g.x = Math.random() * width
        g.y = Math.random() * height
        container.addChild(g)

        const vx = 0.6 + weather.windSpeed * 1.1 + Math.random() * 0.4
        const vy = (Math.random() - 0.5) * 0.2
        particlesRef.current.push({ g, vx, vy, kind: "dust" })
      }
    }
  }, [isInitialized, weather.type, weather.particleCount, mapConfig.width, mapConfig.height])

  // 动画更新：随风速、强度、透明度动态变化
  useEffect(() => {
    if (!isInitialized || !appRef.current) return

    const app = appRef.current
    const tick = (ticker: PIXI.Ticker) => {
      const width = mapConfig.width
      const height = mapConfig.height
      const cfg = weatherRef.current
      const delta = ticker.deltaTime

      if (cfg.type === "sunny") return

      for (let i = 0; i < particlesRef.current.length; i++) {
        const p = particlesRef.current[i]
        let vx = p.vx
        let vy = p.vy

        if (p.kind === "rain") {
          vx = cfg.windSpeed * 1.5
          vy = 4 + cfg.intensity * 8
        } else if (p.kind === "snow") {
          // snow: 轻微左右飘动 + 风速影响
          const drift = Math.sin((p.g.y + p.g.x) * 0.01) * 0.3
          vx = cfg.windSpeed * 0.5 + drift
          vy = 0.8 + cfg.intensity * 1.6
        } else if (p.kind === "cloud") {
          // clouds: slow horizontal drift with gentle vertical oscillation
          vx = 0.3 + cfg.windSpeed * 0.8
          vy = 0
          const baseY = p.baseY ?? p.g.y
          const phase = (p.phase ?? 0) + delta * 0.01
          p.phase = phase
          const amp = p.amp ?? 8
          p.g.y = baseY + Math.sin(phase + p.g.x * 0.002) * amp
        } else if (p.kind === "dust") {
          // dust particles drift horizontally with slight vertical variance
          vx = 0.6 + cfg.windSpeed * 1.1
          vy = (Math.random() - 0.5) * 0.02
        }

        p.g.x += vx * delta
        p.g.y += vy * delta
        p.g.alpha = Math.max(0.05, Math.min(1, cfg.opacity))

        // Wrap 到边界另一侧
        if (p.kind !== "cloud" && p.g.y > height + 12) {
          p.g.y = -10
          p.g.x = Math.random() * width
        }
        if (p.g.x > width + 12) p.g.x = -10
        if (p.g.x < -12) p.g.x = width + 10
      }

      // Lightning logic (only during rainy)
      if (cfg.type === "rainy" && lightningContainerRef.current && lightningFlashRef.current && lightningBoltRef.current) {
        if (lightningCooldownRef.current <= 0 && Math.random() < 0.005 * (0.5 + cfg.intensity)) {
          // Trigger lightning
          const startX = Math.random() * width
          const bolt = lightningBoltRef.current
          bolt.clear()
          bolt.lineStyle(2.5, 0xe5e7eb, 1)
          let x = startX
          let y = 0
          while (y < height * (0.6 + Math.random() * 0.25)) {
            const nextX = x + (Math.random() - 0.5) * 30
            const nextY = y + 20 + Math.random() * 25
            bolt.moveTo(x, y)
            bolt.lineTo(nextX, nextY)
            x = nextX
            y = nextY
          }

          const flash = lightningFlashRef.current
          flash.clear()
          flash.beginFill(0xffffff, 0.0)
          flash.drawRect(0, 0, width, height)
          flash.endFill()
          flash.alpha = 0.0

          // Quick flash
          flash.alpha = Math.min(0.75, 0.35 + cfg.intensity * 0.6)
          lightningCooldownRef.current = 180 // cooldown frames at 60fps ~3s
        } else if (lightningCooldownRef.current > 0) {
          lightningCooldownRef.current -= delta
          const flash = lightningFlashRef.current
          const bolt = lightningBoltRef.current
          if (flash && flash.alpha > 0) {
            flash.alpha *= 0.85
            if (flash.alpha < 0.02) flash.alpha = 0
          }
          if (bolt) {
            bolt.alpha *= 0.9
            if (bolt.alpha < 0.05) {
              bolt.alpha = 0
              bolt.clear()
            }
          }
        }
      }
    }

    app.ticker.add(tick)
    tickerRef.current = tick

    return () => {
      const cb = tickerRef.current
      if (cb) {
        const appInstance = appRef.current
        if (appInstance && (appInstance as any).ticker && typeof (appInstance as any).ticker.remove === "function") {
          ;(appInstance as any).ticker.remove(cb)
        } else if ((app as any).ticker && typeof (app as any).ticker.remove === "function") {
          ;(app as any).ticker.remove(cb)
        }
        tickerRef.current = null
      }
    }
  }, [isInitialized, mapConfig.width, mapConfig.height])

  useEffect(() => {
    if (!backgroundRef.current) return

    const background = backgroundRef.current
    background.clear()

    // Base background color changes with weather
    let backgroundColor = 0x1a4d3a // Default forest green
    let grassOpacity = 0.3

    switch (weather.type) {
      case "rainy":
        backgroundColor = 0x0f2a1f // Darker, more muted
        grassOpacity = 0.2
        break
      case "snowy":
        backgroundColor = 0x2a3a4a // Bluish tint
        grassOpacity = 0.1
        break
      case "dust":
        backgroundColor = 0x3a2a1a // Warm dusty tint
        grassOpacity = 0.18
        break
      case "sunny":
      default:
        backgroundColor = 0x1a4d3a // Bright forest green
        grassOpacity = 0.3
        break
    }

    background.beginFill(backgroundColor)
    background.drawRect(0, 0, mapConfig.width, mapConfig.height)
    background.endFill()

    // Add grass texture with weather-adjusted opacity
    for (let x = 0; x < mapConfig.width; x += 16) {
      for (let y = 0; y < mapConfig.height; y += 16) {
        if (Math.random() > 0.7) {
          background.beginFill(0x228b22, grassOpacity)
          background.drawRect(x, y, 4, 4)
          background.endFill()
        }
      }
    }

    // Draw snow ground overlay intensity (separate layer)
    if (snowOverlayRef.current) {
      const snow = snowOverlayRef.current
      snow.clear()
      if (weather.type === "snowy") {
        const overlayAlpha = Math.min(0.5, 0.15 + weather.intensity * 0.5)
        snow.beginFill(0xffffff, overlayAlpha * weather.opacity)
        snow.drawRect(0, 0, mapConfig.width, mapConfig.height)
        snow.endFill()
        // Soft vignette to avoid hard edges
        for (let i = 0; i < 60; i++) {
          const x = Math.random() * mapConfig.width
          const y = Math.random() * mapConfig.height
          const radius = 4 + Math.random() * 12
          snow.beginFill(0xffffff, 0.05)
          snow.drawCircle(x, y, radius)
          snow.endFill()
        }
      }
    }

    // Draw dust overlay warm wash
    if (dustOverlayRef.current) {
      const dust = dustOverlayRef.current
      dust.clear()
      if (weather.type === "dust") {
        const washAlpha = Math.min(0.45, 0.12 + weather.intensity * 0.4) * weather.opacity
        dust.beginFill(0xdeb887, washAlpha)
        dust.drawRect(0, 0, mapConfig.width, mapConfig.height)
        dust.endFill()
        // add soft speckles to avoid flat color
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * mapConfig.width
          const y = Math.random() * mapConfig.height
          const r = 2 + Math.random() * 6
          dust.beginFill(0xd2b48c, 0.05)
          dust.drawCircle(x, y, r)
          dust.endFill()
        }
      }
    }
  }, [weather, mapConfig])

  useEffect(() => {
    if (!canvasRef.current) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      if (isDragging) {
        const rect = canvasRef.current!.getBoundingClientRect()
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }
        onDragOver(position)
      }
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      if (isDragging) {
        const rect = canvasRef.current!.getBoundingClientRect()
        const canvasX = e.clientX - rect.left
        const canvasY = e.clientY - rect.top

        // Snap to grid for accurate placement
        const gridX = Math.floor(canvasX / mapConfig.tileSize)
        const gridY = Math.floor(canvasY / mapConfig.tileSize)
        const snappedPosition = {
          x: gridX * mapConfig.tileSize,
          y: gridY * mapConfig.tileSize,
        }

        onDrop(snappedPosition)
      }
    }

    const element = canvasRef.current
    element.addEventListener("dragover", handleDragOver)
    element.addEventListener("drop", handleDrop)

    return () => {
      element.removeEventListener("dragover", handleDragOver)
      element.removeEventListener("drop", handleDrop)
    }
  }, [isDragging, onDragOver, onDrop])

  // Update grid visibility
  useEffect(() => {
    if (!gridRef.current) return

    gridRef.current.clear()

    if (showGrid) {
      gridRef.current.lineStyle(1, 0x666666, 0.3)

      // Draw vertical lines
      for (let x = 0; x <= mapConfig.width; x += mapConfig.tileSize) {
        gridRef.current.moveTo(x, 0)
        gridRef.current.lineTo(x, mapConfig.height)
      }

      // Draw horizontal lines
      for (let y = 0; y <= mapConfig.height; y += mapConfig.tileSize) {
        gridRef.current.moveTo(0, y)
        gridRef.current.lineTo(mapConfig.width, y)
      }
    }
  }, [showGrid, mapConfig])

  useEffect(() => {
    if (!collisionRef.current || !getCollisionVisualization) return

    collisionRef.current.clear()

    if (showCollisions) {
      const { occupiedCells, modelBounds } = getCollisionVisualization()

      // Draw occupied cells
      occupiedCells.forEach((cellKey) => {
        const [gridX, gridY] = cellKey.split(",").map(Number)
        const x = gridX * mapConfig.tileSize
        const y = gridY * mapConfig.tileSize

        collisionRef.current!.beginFill(0xff0000, 0.2)
        collisionRef.current!.lineStyle(1, 0xff0000, 0.5)
        collisionRef.current!.drawRect(x, y, mapConfig.tileSize, mapConfig.tileSize)
        collisionRef.current!.endFill()
      })

      // Draw model bounds
      modelBounds.forEach(({ model, bounds }) => {
        bounds.forEach((cell) => {
          const x = cell.gridX * mapConfig.tileSize
          const y = cell.gridY * mapConfig.tileSize

          // Different colors for different model types
          let color = 0xff0000
          switch (model.category) {
            case "character":
              color = 0x00ff00
              break
            case "plant":
              color = 0x0000ff
              break
            case "building":
              color = 0xffff00
              break
          }

          collisionRef.current!.lineStyle(2, color, 0.8)
          collisionRef.current!.drawRect(x, y, mapConfig.tileSize, mapConfig.tileSize)
        })
      })
    }
  }, [showCollisions, models, mapConfig, getCollisionVisualization])

  useEffect(() => {
    if (!previewRef.current) return

    previewRef.current.clear()

    if (isDragging && draggedTemplate) {
      // Snap to grid
      const gridX = Math.floor(dragPosition.x / mapConfig.tileSize)
      const gridY = Math.floor(dragPosition.y / mapConfig.tileSize)
      const snappedX = gridX * mapConfig.tileSize
      const snappedY = gridY * mapConfig.tileSize

      // Check collision if function is available
      let isValidPosition = true
      if (getCollisionInfo) {
        const collisionInfo = getCollisionInfo({ gridX, gridY }, draggedTemplate.defaultGridSize)
        isValidPosition = collisionInfo.validPosition
      }

      // 绘制预览轮廓，简化处理
      const color = isValidPosition ? 0x00ff00 : 0xff0000
      const alpha = isValidPosition ? 0.8 : 0.5

      previewRef.current.lineStyle(2, color, alpha)
      previewRef.current.beginFill(color, 0.2)
      previewRef.current.drawRect(
        snappedX,
        snappedY,
        draggedTemplate.defaultGridSize.gridWidth * mapConfig.tileSize,
        draggedTemplate.defaultGridSize.gridHeight * mapConfig.tileSize,
      )
      previewRef.current.endFill()

      // 绘制模板图标预览
      const centerX = snappedX + (draggedTemplate.defaultGridSize.gridWidth * mapConfig.tileSize) / 2
      const centerY = snappedY + (draggedTemplate.defaultGridSize.gridHeight * mapConfig.tileSize) / 2

      previewRef.current.lineStyle(0)
      switch (draggedTemplate.category) {
        case "character":
          previewRef.current.beginFill(0x27ae60, 0.7)
          previewRef.current.drawRect(centerX - 8, centerY - 16, 16, 32)
          break
        case "plant":
          previewRef.current.beginFill(0x228b22, 0.7)
          previewRef.current.drawRect(centerX - 8, centerY - 16, 16, 32)
          break
        case "building":
          previewRef.current.beginFill(0x8b4513, 0.7)
          previewRef.current.drawRect(centerX - 16, centerY - 16, 32, 32)
          break
      }
      previewRef.current.endFill()
    }
  }, [isDragging, draggedTemplate, dragPosition, mapConfig, getCollisionInfo])

  // Update models display
  useEffect(() => {
    if (!modelsContainerRef.current) return

    // Clear existing models
    modelsContainerRef.current.removeChildren()

    // Add models - 使用共享渲染工具类
    models.forEach((model) => {
      const modelGraphics = RenderUtils.createModelGraphics(model, selectedModel?.id === model.id)
      modelsContainerRef.current!.addChild(modelGraphics)
    })
  }, [models, selectedModel])



  return (
    <Card className="p-0 overflow-hidden">
      <div className="relative">
        <div
          ref={canvasRef}
          className={`${isDragging ? "cursor-copy" : "cursor-crosshair"}`}
          style={{
            width: `${mapConfig.width}px`,
            height: `${mapConfig.height}px`,
          }}
        />
        <LoadingOverlay open={!isInitialized} message="正在初始化编辑器…" />
      </div>
    </Card>
  )
}
