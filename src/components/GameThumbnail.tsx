"use client"

import { useEffect, useRef, useState } from "react"
import * as PIXI from "pixi.js"
import type { GameModel, MapConfig, WeatherConfig } from "@/types/mapEditor"
import { WeatherType } from "@/types/mapEditor"
import { RenderUtils } from "@/utils/renderUtils"

interface GameThumbnailProps {
  mapConfig: MapConfig
  models: GameModel[]
  width?: number
  height?: number
  className?: string
}

export default function GameThumbnail({ mapConfig, models, width = 320, height = 180, className }: GameThumbnailProps) {
  const [ready, setReady] = useState(false)
  const [dataUrl, setDataUrl] = useState<string>("")
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let destroyed = false
    const render = async () => {
      try {
        const app = new PIXI.Application()
        // 以地图原始尺寸初始化，避免双重缩放导致空画面
        await app.init({ width: mapConfig.width, height: mapConfig.height, backgroundAlpha: 0 })

        // 背景与模型使用原尺寸渲染
        const bg = RenderUtils.createBackground(mapConfig)
        app.stage.addChild(bg)

        // 与预览/编辑器一致：覆盖层（雪地/沙尘）与少量静态粒子
        const cfg: WeatherConfig = (mapConfig as any).weatherConfig || {
          type: mapConfig.weather as any,
          intensity: 0.5,
          particleCount: 200,
          windSpeed: 1,
          opacity: 0.8,
        }

        if (cfg.type === WeatherType.SNOWY) {
          const snowOverlay = new PIXI.Graphics()
          const overlayAlpha = Math.min(0.5, 0.15 + cfg.intensity * 0.5) * cfg.opacity
          snowOverlay.beginFill(0xffffff, overlayAlpha)
          snowOverlay.drawRect(0, 0, mapConfig.width, mapConfig.height)
          snowOverlay.endFill()
          for (let i = 0; i < 60; i++) {
            const x = Math.random() * mapConfig.width
            const y = Math.random() * mapConfig.height
            const r = 4 + Math.random() * 12
            snowOverlay.beginFill(0xffffff, 0.05)
            snowOverlay.drawCircle(x, y, r)
            snowOverlay.endFill()
          }
          app.stage.addChild(snowOverlay)
        }

        if (cfg.type === WeatherType.DUST) {
          const dustOverlay = new PIXI.Graphics()
          const washAlpha = Math.min(0.45, 0.12 + cfg.intensity * 0.4) * cfg.opacity
          dustOverlay.beginFill(0xdeb887, washAlpha)
          dustOverlay.drawRect(0, 0, mapConfig.width, mapConfig.height)
          dustOverlay.endFill()
          for (let i = 0; i < 50; i++) {
            const x = Math.random() * mapConfig.width
            const y = Math.random() * mapConfig.height
            const r = 2 + Math.random() * 6
            dustOverlay.beginFill(0xd2b48c, 0.05)
            dustOverlay.drawCircle(x, y, r)
            dustOverlay.endFill()
          }
          app.stage.addChild(dustOverlay)
        }

        models.forEach((m) => {
          const g = RenderUtils.createModelGraphics(m, false)
          app.stage.addChild(g)
        })

        // 静态粒子（非动画，仅提升缩略图一致性）
        if (cfg.type === WeatherType.RAINY) {
          const count = Math.min(200, Math.max(20, Math.floor((cfg.particleCount || 200) * 0.2)))
          for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics()
            const len = 8 + Math.random() * (12 + cfg.intensity * 20)
            const thickness = 1 + Math.random() * 0.8
            const alpha = Math.min(1, 0.45 + cfg.opacity * 0.55)
            g.beginFill(0x60a5fa, alpha)
            g.drawRect(0, 0, thickness, len)
            g.endFill()
            g.x = Math.random() * mapConfig.width
            g.y = Math.random() * mapConfig.height
            app.stage.addChild(g)
          }
        } else if (cfg.type === WeatherType.SNOWY) {
          const count = Math.min(200, Math.max(20, Math.floor((cfg.particleCount || 200) * 0.2)))
          for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics()
            const radius = 1 + Math.random() * 2.2
            g.beginFill(0xffffff, Math.min(1, 0.6 + cfg.opacity * 0.5))
            g.drawCircle(0, 0, radius)
            g.endFill()
            g.x = Math.random() * mapConfig.width
            g.y = Math.random() * mapConfig.height
            app.stage.addChild(g)
          }
        } else if (cfg.type === WeatherType.DUST) {
          const count = Math.min(300, Math.max(30, Math.floor((cfg.particleCount || 200) * 0.3)))
          for (let i = 0; i < count; i++) {
            const g = new PIXI.Graphics()
            const r = Math.random() * 1.2 + 0.4
            const alpha = 0.15 + cfg.opacity * 0.35
            g.beginFill(0xd2b48c, alpha)
            g.drawCircle(0, 0, r)
            g.endFill()
            g.x = Math.random() * mapConfig.width
            g.y = Math.random() * mapConfig.height
            app.stage.addChild(g)
          }
        }

        // 手动渲染一帧，确保画面已绘制
        app.renderer.render(app.stage)

        // 提取画面
        const url = app.canvas.toDataURL()
        if (!destroyed) {
          setDataUrl(url)
          setReady(true)
        }

        app.destroy(true, { children: true, texture: true })
      } catch (e) {
        console.error("Thumbnail render error", e)
      }
    }
    render()
    return () => {
      destroyed = true
    }
  }, [mapConfig, models, width, height])

  return (
    <div ref={containerRef} className={className} style={{ width, height }}>
      {!ready ? (
        <div className="w-full h-full bg-gray-200 animate-pulse rounded-md" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="game-thumbnail" className="w-full h-full object-cover rounded-md mx-auto" />
      )}
    </div>
  )
}


