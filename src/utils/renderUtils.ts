import * as PIXI from "pixi.js"
import type { GameModel, MapConfig } from "@/types/mapEditor"
import { ModelCategory, WeatherType, CharacterTemplateId } from "@/types/mapEditor"

/**
 * 共享的渲染工具类，提供地图编辑器和游戏运行器使用的一致渲染方法
 */
export class RenderUtils {
  /**
   * 创建模型图形 - 统一的模型渲染逻辑
   */
  static createModelGraphics(model: GameModel, isSelected: boolean = false): PIXI.Graphics {
    const graphics = new PIXI.Graphics()

    // 使用统一的模型渲染逻辑
    switch (model.category) {
      case ModelCategory.CHARACTER:
        {
          const templateId = model.templateId
          const isMerchant = templateId === CharacterTemplateId.MERCHANT
          const isGuard = templateId === CharacterTemplateId.GUARD
          const isVillager = templateId === CharacterTemplateId.VILLAGER
          const isElder = templateId === CharacterTemplateId.ELDER
          const isChild = templateId === CharacterTemplateId.CHILD
          const isArtisan = templateId === CharacterTemplateId.ARTISAN

          // 基础配色
          let body = 0x27ae60 // 默认绿色
          if (isMerchant) body = 0xd35400 // 橙色外袍
          else if (isGuard) body = 0x34495e // 深蓝护甲
          else if (isVillager) body = 0x2ecc71 // 草绿便装
          else if (isElder) body = 0x95a5a6 // 灰色长袍
          else if (isChild) body = 0x9b59b6 // 紫色背带
          else if (isArtisan) body = 0x6b4423 // 深棕色工作服

          // 身体（根据角色差异微调尺寸）
          const bodyHeight = isChild ? 12 : isElder ? 14 : isArtisan ? 18 : 16
          graphics.beginFill(body)
          graphics.drawRect(0, 8, 16, bodyHeight)
        graphics.endFill()

          // 头部
          const headY = isChild ? 1 : 0
        graphics.beginFill(0xf4c2a1)
          graphics.drawRect(4, headY, 8, 8)
        graphics.endFill()

          // 眼睛
        graphics.beginFill(0x000000)
          graphics.drawRect(5, headY + 2, 2, 2)
          graphics.drawRect(9, headY + 2, 2, 2)
          graphics.endFill()

          // 腿部（儿童更短）与身体底部对齐
          const legY = 8 + bodyHeight
          const legH = isChild ? 6 : 8
          const legColor = isGuard ? 0x2c3e50 : 0x8b4513
          graphics.beginFill(legColor)
          graphics.drawRect(2, legY, 4, legH)
          graphics.drawRect(10, legY, 4, legH)
        graphics.endFill()

          // 配件
          if (isMerchant) {
            // 挎包
            graphics.beginFill(0x6e2c00)
            graphics.drawRect(12, 14, 4, 4)
            graphics.endFill()
            graphics.lineStyle(1, 0x6e2c00, 1)
            graphics.moveTo(12, 14)
            graphics.lineTo(8, 10)
          }
          if (isGuard) {
            // 头盔
            graphics.beginFill(0xbdc3c7)
            graphics.drawRect(3, headY - 2, 10, 3)
            graphics.endFill()
            // 盾牌
            graphics.beginFill(0xc0392b)
            graphics.drawRect(-3, 14, 3, 8)
            graphics.endFill()
          }
          if (isVillager) {
            // 围裙
            graphics.beginFill(0xecf0f1)
            graphics.drawRect(4, 16, 8, 8)
            graphics.endFill()
          }
          if (isElder) {
            // 手杖
            graphics.beginFill(0x7f8c8d)
            graphics.drawRect(14, 12, 2, 12)
            graphics.endFill()
          }
          if (isChild) {
            // 背包
            graphics.beginFill(0x2980b9)
            graphics.drawRect(-2, 12, 4, 6)
        graphics.endFill()
          }
          if (isArtisan) {
            // 皮革围裙
            graphics.beginFill(0x8b4513)
            graphics.drawRect(2, 20, 12, 10)
            graphics.endFill()
            // 围裙带
            graphics.lineStyle(1, 0x5d2f0a, 1)
            graphics.moveTo(4, 16)
            graphics.lineTo(12, 16)
            graphics.lineStyle(0)
            // 锻造锤（右手）
            graphics.beginFill(0x8b4513) // 锤柄
            graphics.drawRect(14, 18, 2, 8)
            graphics.endFill()
            graphics.beginFill(0x7f8c8d) // 锤头
            graphics.drawRect(12, 18, 6, 4)
            graphics.endFill()
            // 肌肉线条（强壮体型）
            graphics.lineStyle(1, 0x5d2f0a, 0.7)
            graphics.moveTo(4, 14)
            graphics.lineTo(6, 16)
            graphics.moveTo(10, 16)
            graphics.lineTo(12, 14)
            graphics.lineStyle(0)
          }
        }
        break

      case ModelCategory.PLANT:
        {
          const plantType = ((model as any).plantType || (model as any).name || "").toString().toLowerCase()

          if (plantType.includes("oak") || plantType.includes("橡")) {
            // 橡树：粗树干 + 宽叶冠
            graphics.beginFill(0x8b4513)
            graphics.drawRect(7, 18, 2, 14)
            graphics.endFill()

            graphics.beginFill(0x2e8b57)
            graphics.drawCircle(8, 12, 10)
            graphics.endFill()
          } else if (plantType.includes("pine") || plantType.includes("松")) {
            // 松树：锥形叶冠 + 窄树干
        graphics.beginFill(0x8b4513)
            graphics.drawRect(7, 22, 2, 10)
            graphics.endFill()

            graphics.beginFill(0x006400)
            graphics.drawPolygon([8, 2, 0, 18, 16, 18])
            graphics.endFill()
            graphics.beginFill(0x0b8f38)
            graphics.drawPolygon([8, 8, 2, 20, 14, 20])
            graphics.endFill()
          } else if (plantType.includes("berry") || plantType.includes("浆果")) {
            // 浆果丛：占据单元格大部分区域，碰撞与视觉一致（1x1）
            graphics.beginFill(0x228b22)
            graphics.drawRoundedRect(2, 2, 12, 12, 3)
            graphics.endFill()

            graphics.beginFill(0x8e44ad)
            graphics.drawCircle(6, 6, 1.6)
            graphics.drawCircle(11, 8, 1.6)
            graphics.drawCircle(9, 12, 1.6)
            graphics.endFill()
          } else if (plantType.includes("flower") || plantType.includes("花")) {
            // 花丛：占据单元格大部分区域
            // 叶基底
            graphics.beginFill(0x2ecc71)
            graphics.drawRoundedRect(2, 10, 12, 4, 2)
            graphics.endFill()

            // 花瓣簇
            graphics.beginFill(0xff69b4)
            graphics.drawCircle(8, 6, 3)
            graphics.drawCircle(11, 8, 3)
            graphics.drawCircle(5, 8, 3)
            graphics.endFill()
            // 花心
            graphics.beginFill(0xffe066)
            graphics.drawCircle(8, 8, 2)
            graphics.endFill()
          } else {
            // 默认灌木
        graphics.beginFill(0x228b22)
            graphics.drawRoundedRect(2, 14, 12, 12, 3)
        graphics.endFill()
          }
        }
        break

      case ModelCategory.BUILDING:
        {
          const btype = ((model as any).buildingType || (model as any).name || "").toString().toLowerCase()
          const w = Math.max(24, Math.floor(model.size.width / 2))
          const h = Math.max(24, Math.floor(model.size.height / 2))

          if (btype.includes("house") || btype.includes("屋") || btype.includes("小屋")) {
            // 小屋：红屋顶 + 木墙 + 门窗
            graphics.beginFill(0xc0392b)
            graphics.drawPolygon([0, 12, w / 2, 0, w, 12])
            graphics.endFill()

            graphics.beginFill(0xd7b899)
            graphics.drawRect(0, 12, w, h - 12)
            graphics.endFill()

            // 门
            graphics.beginFill(0x6e2c00)
            graphics.drawRect(w / 2 - 4, h - 12, 8, 12)
            graphics.endFill()
            // 窗
            graphics.beginFill(0xecf0f1)
            graphics.drawRect(4, 20, 8, 6)
            graphics.drawRect(w - 12, 20, 8, 6)
            graphics.endFill()
          } else if (btype.includes("shop") || btype.includes("店") || btype.includes("杂货")) {
            // 商店：橙屋顶 + 条纹遮阳篷 + 落地橱窗 + 门 + 招牌
            // 屋顶
            graphics.beginFill(0xe67e22)
            graphics.drawPolygon([0, 10, w / 2, 0, w, 10])
            graphics.endFill()

            // 墙体
            graphics.beginFill(0xf5deb3)
            graphics.drawRect(0, 10, w, h - 10)
            graphics.endFill()

            // 遮阳篷底板
        graphics.beginFill(0xe74c3c)
            graphics.drawRect(0, 12, w, 4)
            graphics.endFill()
            // 遮阳篷条纹
            graphics.beginFill(0xffffff)
            for (let x = 0; x < w; x += 6) {
              graphics.drawRect(x, 12, 3, 4)
            }
            graphics.endFill()

            // 左侧门
            graphics.beginFill(0x6e2c00)
            graphics.drawRect(4, 18, 10, h - 20)
            graphics.endFill()
            // 门把手
            graphics.beginFill(0xf1c40f)
            graphics.drawCircle(12, 24, 1)
            graphics.endFill()

            // 右侧大橱窗（带分隔栅格）
            const winX = 16
            const winW = w - winX - 4
            const winH = h - 22
            graphics.beginFill(0x85c1e9)
            graphics.drawRect(winX, 18, winW, winH)
            graphics.endFill()
            // 窗格线
            graphics.lineStyle(1, 0xffffff, 0.8)
            graphics.moveTo(winX + winW / 2, 18)
            graphics.lineTo(winX + winW / 2, 18 + winH)
            graphics.moveTo(winX, 18 + winH / 2)
            graphics.lineTo(winX + winW, 18 + winH / 2)
            graphics.lineStyle(0)

            // 基座阴影
            graphics.beginFill(0xd0b49e)
            graphics.drawRect(0, h - 4, w, 4)
            graphics.endFill()

            // 立体招牌（右上角）
            graphics.beginFill(0x2c3e50)
            graphics.drawRect(w - 18, 6, 16, 6)
            graphics.endFill()
            graphics.beginFill(0xf1c40f)
            graphics.drawRect(w - 16, 8, 3, 2) // 简化小徽记
            graphics.endFill()
          } else if (btype.includes("tower") || btype.includes("塔") || btype.includes("瞭望")) {
            // 瞭望塔：石质圆顶 + 高墙 + 窥视孔
            graphics.beginFill(0x95a5a6)
            graphics.drawCircle(w / 2, 6, 6)
            graphics.endFill()

            graphics.beginFill(0x7f8c8d)
            graphics.drawRect(w / 4, 12, w / 2, h - 12)
            graphics.endFill()

            graphics.beginFill(0x2c3e50)
            graphics.drawRect(w / 2 - 3, 18, 6, 2)
            graphics.drawRect(w / 2 - 3, 24, 6, 2)
            graphics.endFill()
          } else if (btype.includes("well") || btype.includes("井")) {
            // 水井：圆井 + 顶梁 + 吊桶
            graphics.beginFill(0x95a5a6)
            graphics.drawCircle(w / 2, h / 2 + 6, 8)
            graphics.endFill()

            graphics.beginFill(0x7f8c8d)
            graphics.drawCircle(w / 2, h / 2 + 6, 6)
        graphics.endFill()

            // 顶梁
        graphics.beginFill(0x8b4513)
            graphics.drawRect(w / 2 - 12, h / 2 - 6, 24, 2)
            graphics.drawRect(w / 2 - 12, h / 2 - 6, 2, 12)
            graphics.drawRect(w / 2 + 10, h / 2 - 6, 2, 12)
            graphics.endFill()
          } else {
            // 默认建筑
            graphics.beginFill(0xbdc3c7)
            graphics.drawRect(0, 8, w, h - 8)
            graphics.endFill()

            graphics.beginFill(0x7f8c8d)
            graphics.drawPolygon([0, 8, w / 2, 0, w, 8])
        graphics.endFill()
          }
        }
        break
    }

    // 添加选择高亮
    if (isSelected) {
      graphics.lineStyle(2, 0xffff00, 1)
      graphics.drawRect(-2, -2, model.size.width / 2 + 4, model.size.height / 2 + 4)
    }

    // 设置位置和缩放
    graphics.x = model.position.x
    graphics.y = model.position.y
    graphics.scale.set(2) // 统一2倍缩放

    return graphics
  }

  /**
   * 创建玩家图形（玩家与一般角色在配色上区分）
   */
  static createPlayerGraphics(position: { x: number; y: number }, scale: number = 2): PIXI.Graphics {
    const player = new PIXI.Graphics()

    // 身体
    player.beginFill(0x3498db)
    player.drawRect(0, 8, 16, 16)
    player.endFill()

    // 头部
    player.beginFill(0xf4c2a1)
    player.drawRect(4, 0, 8, 8)
    player.endFill()

    // 眼睛
    player.beginFill(0x000000)
    player.drawRect(5, 2, 2, 2)
    player.drawRect(9, 2, 2, 2)
    player.endFill()

    // 腿部
    player.beginFill(0x8b4513)
    player.drawRect(2, 24, 4, 8)
    player.drawRect(10, 24, 4, 8)
    player.endFill()

    // 位置与缩放
    player.x = position.x
    player.y = position.y
    player.scale.set(scale)

    return player
  }

  /**
   * 根据背景类型获取背景颜色
   */
  static getBackgroundColor(backgroundType: string): number {
    switch (backgroundType) {
      case "forest":
        return 0x1a4d3a // 森林绿
      case "grass":
      case "grassland":
        return 0x2ecc71 // 草地绿
      case "desert":
        return 0xd4a574 // 沙漠色
      case "snow":
        return 0xe8f4f8 // 雪白色
      default:
        return 0x1a4d3a // 默认森林绿
    }
  }

  /**
   * 根据天气调整颜色
   */
  static adjustColorForWeather(color: number, brightness: number, blueTint: boolean = false): number {
    const r = (color >> 16) & 0xFF
    const g = (color >> 8) & 0xFF
    const b = color & 0xFF

    let newR = Math.max(0, Math.min(255, r + (r * brightness)))
    let newG = Math.max(0, Math.min(255, g + (g * brightness)))
    let newB = Math.max(0, Math.min(255, b + (b * brightness)))

    // 蓝色调整（用于雪天）
    if (blueTint) {
      newB = Math.min(255, newB + 20)
      newR = Math.max(0, newR - 10)
      newG = Math.max(0, newG - 5)
    }

    return (Math.floor(newR) << 16) | (Math.floor(newG) << 8) | Math.floor(newB)
  }

  /**
   * 创建背景纹理
   */
  static createBackgroundTexture(background: PIXI.Graphics, config: MapConfig, opacity: number): void {
    switch (config.backgroundType) {
      case "forest":
        // 森林纹理 - 草地斑点
        for (let x = 0; x < config.width; x += 16) {
          for (let y = 0; y < config.height; y += 16) {
            if (Math.random() > 0.7) {
              background.beginFill(0x228b22, opacity)
              background.drawRect(x, y, 4, 4)
              background.endFill()
            }
          }
        }
        break

      case "grass":
      case "grassland":
        // 草地纹理 - 更密集的草地斑点
        for (let x = 0; x < config.width; x += 12) {
          for (let y = 0; y < config.height; y += 12) {
            if (Math.random() > 0.6) {
              background.beginFill(0x27ae60, opacity)
              background.drawRect(x, y, 3, 3)
              background.endFill()
            }
          }
        }
        break

      case "desert":
        // 沙漠纹理 - 沙丘和仙人掌色斑点
        for (let x = 0; x < config.width; x += 20) {
          for (let y = 0; y < config.height; y += 20) {
            if (Math.random() > 0.8) {
              background.beginFill(0xdaa520, opacity * 0.5)
              background.drawCircle(x, y, 3)
              background.endFill()
            }
          }
        }
        break

      case "snow":
        // 雪地纹理 - 雪花斑点
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * config.width
          const y = Math.random() * config.height
          const size = 4 + Math.random() * 8

          background.beginFill(0xffffff, opacity * 2)
          background.drawCircle(x, y, size)
          background.endFill()
        }
        break

      default:
        // 默认纹理
        for (let x = 0; x < config.width; x += 16) {
          for (let y = 0; y < config.height; y += 16) {
            if (Math.random() > 0.7) {
              background.beginFill(0x228b22, opacity)
              background.drawRect(x, y, 4, 4)
              background.endFill()
            }
          }
        }
    }
  }

  /**
   * 创建完整的背景图形
   */
  static createBackground(config: MapConfig): PIXI.Graphics {
    const background = new PIXI.Graphics()

    // 使用与编辑器 MapCanvas 相同的调色方案
    let backgroundColor = 0x1a4d3a // 默认森林绿（晴天）
    let grassOpacity = 0.3

    switch (config.weather) {
      case WeatherType.RAINY:
        backgroundColor = 0x0f2a1f // 更暗、更闷
        grassOpacity = 0.2
        break
      case WeatherType.SNOWY:
        backgroundColor = 0x2a3a4a // 略带蓝的冷色
        grassOpacity = 0.1
        break
      case WeatherType.DUST:
        backgroundColor = 0x3a2a1a // 暖调、偏暗
        grassOpacity = 0.18
        break
      case WeatherType.SUNNY:
      default:
        backgroundColor = 0x1a4d3a
        grassOpacity = 0.3
        break
    }

    background.beginFill(backgroundColor)
    background.drawRect(0, 0, config.width, config.height)
    background.endFill()

    // 添加纹理
    this.createBackgroundTexture(background, config, grassOpacity)

    return background
  }

  /**
   * 创建预览图形（用于拖拽时的预览）
   */
  static createPreviewGraphics(
    template: any,
    position: { x: number; y: number },
    mapConfig: MapConfig,
    isValidPosition: boolean = true
  ): PIXI.Graphics {
    const preview = new PIXI.Graphics()

    // 网格对齐
    const gridX = Math.floor(position.x / mapConfig.tileSize)
    const gridY = Math.floor(position.y / mapConfig.tileSize)
    const snappedX = gridX * mapConfig.tileSize
    const snappedY = gridY * mapConfig.tileSize

    // 根据位置有效性选择颜色
    const color = isValidPosition ? 0x00ff00 : 0xff0000
    const alpha = isValidPosition ? 0.8 : 0.5

    preview.lineStyle(2, color, alpha)
    preview.beginFill(color, 0.2)
    preview.drawRect(
      snappedX,
      snappedY,
      template.defaultGridSize.gridWidth * mapConfig.tileSize,
      template.defaultGridSize.gridHeight * mapConfig.tileSize,
    )
    preview.endFill()

    // 绘制模板图标预览
    const centerX = snappedX + (template.defaultGridSize.gridWidth * mapConfig.tileSize) / 2
    const centerY = snappedY + (template.defaultGridSize.gridHeight * mapConfig.tileSize) / 2

    preview.lineStyle(0)
    switch (template.category) {
      case ModelCategory.CHARACTER:
        preview.beginFill(0x27ae60, 0.7)
        preview.drawRect(centerX - 8, centerY - 16, 16, 32)
        break
      case ModelCategory.PLANT:
        preview.beginFill(0x228b22, 0.7)
        preview.drawRect(centerX - 8, centerY - 16, 16, 32)
        break
      case ModelCategory.BUILDING:
        preview.beginFill(0x8b4513, 0.7)
        preview.drawRect(centerX - 16, centerY - 16, 32, 32)
        break
    }
    preview.endFill()

    return preview
  }

  /**
   * 获取PIXI应用初始化配置
   */
  static getPixiInitConfig(config: MapConfig): any {
    return {
      width: config.width,
      height: config.height,
      backgroundColor: this.getBackgroundColor(config.backgroundType),
      antialias: false, // 像素风格
    }
  }
}
