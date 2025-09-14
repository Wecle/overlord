import type { GridPosition, GridSize, GameModel, Position } from "@/types/mapEditor"

export interface CollisionResult {
  hasCollision: boolean
  collidingModels: GameModel[]
  isOutOfBounds: boolean
  validPosition: boolean
}

export class CollisionDetector {
  private gridWidth: number
  private gridHeight: number
  private tileSize: number

  constructor(gridWidth: number, gridHeight: number, tileSize: number) {
    this.gridWidth = gridWidth
    this.gridHeight = gridHeight
    this.tileSize = tileSize
  }

  // Convert pixel position to grid position
  pixelToGrid(pixelPos: Position): GridPosition {
    return {
      gridX: Math.floor(pixelPos.x / this.tileSize),
      gridY: Math.floor(pixelPos.y / this.tileSize),
    }
  }

  // Convert grid position to pixel position
  gridToPixel(gridPos: GridPosition): Position {
    return {
      x: gridPos.gridX * this.tileSize,
      y: gridPos.gridY * this.tileSize,
    }
  }

  // Snap position to grid
  snapToGrid(position: Position): Position {
    const gridPos = this.pixelToGrid(position)
    return this.gridToPixel(gridPos)
  }

  // Check if grid position is within bounds
  isWithinBounds(gridPos: GridPosition, gridSize: GridSize): boolean {
    return (
      gridPos.gridX >= 0 &&
      gridPos.gridY >= 0 &&
      gridPos.gridX + gridSize.gridWidth <= this.gridWidth &&
      gridPos.gridY + gridSize.gridHeight <= this.gridHeight
    )
  }

  // Check if two grid rectangles overlap
  private gridRectanglesOverlap(pos1: GridPosition, size1: GridSize, pos2: GridPosition, size2: GridSize): boolean {
    return !(
      pos1.gridX >= pos2.gridX + size2.gridWidth ||
      pos1.gridX + size1.gridWidth <= pos2.gridX ||
      pos1.gridY >= pos2.gridY + size2.gridHeight ||
      pos1.gridY + size1.gridHeight <= pos2.gridY
    )
  }

  // Get all grid cells occupied by a model
  getOccupiedCells(gridPos: GridPosition, gridSize: GridSize): GridPosition[] {
    const cells: GridPosition[] = []
    for (let x = gridPos.gridX; x < gridPos.gridX + gridSize.gridWidth; x++) {
      for (let y = gridPos.gridY; y < gridPos.gridY + gridSize.gridHeight; y++) {
        cells.push({ gridX: x, gridY: y })
      }
    }
    return cells
  }

  // Check collision with comprehensive result
  checkCollision(gridPos: GridPosition, gridSize: GridSize, models: GameModel[], excludeId?: string): CollisionResult {
    const isOutOfBounds = !this.isWithinBounds(gridPos, gridSize)
    const collidingModels: GameModel[] = []

    // Check collision with existing models
    for (const model of models) {
      if (excludeId && model.id === excludeId) continue

      if (this.gridRectanglesOverlap(gridPos, gridSize, model.gridPosition, model.gridSize)) {
        collidingModels.push(model)
      }
    }

    const hasCollision = collidingModels.length > 0
    const validPosition = !hasCollision && !isOutOfBounds

    return {
      hasCollision,
      collidingModels,
      isOutOfBounds,
      validPosition,
    }
  }

  // Find nearest valid position
  findNearestValidPosition(
    targetPos: GridPosition,
    gridSize: GridSize,
    models: GameModel[],
    maxSearchRadius = 10,
  ): GridPosition | null {
    // Try the target position first
    const targetResult = this.checkCollision(targetPos, gridSize, models)
    if (targetResult.validPosition) {
      return targetPos
    }

    // Search in expanding squares around the target
    for (let radius = 1; radius <= maxSearchRadius; radius++) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only check positions on the edge of the current radius
          if (Math.abs(dx) !== radius && Math.abs(dy) !== radius) continue

          const testPos: GridPosition = {
            gridX: targetPos.gridX + dx,
            gridY: targetPos.gridY + dy,
          }

          const result = this.checkCollision(testPos, gridSize, models)
          if (result.validPosition) {
            return testPos
          }
        }
      }
    }

    return null
  }

  // Get collision visualization data
  getCollisionVisualization(models: GameModel[]): {
    occupiedCells: Set<string>
    modelBounds: Array<{ model: GameModel; bounds: GridPosition[] }>
  } {
    const occupiedCells = new Set<string>()
    const modelBounds: Array<{ model: GameModel; bounds: GridPosition[] }> = []

    for (const model of models) {
      const bounds = this.getOccupiedCells(model.gridPosition, model.gridSize)
      modelBounds.push({ model, bounds })

      // Add to occupied cells set
      bounds.forEach((cell) => {
        occupiedCells.add(`${cell.gridX},${cell.gridY}`)
      })
    }

    return { occupiedCells, modelBounds }
  }

  // Axis-Aligned Bounding Box (AABB) collision test on pixel space
  static hitTestAABB(
    r1: { x: number; y: number; width: number; height: number },
    r2: { x: number; y: number; width: number; height: number },
  ): boolean {
    const r1CenterX = r1.x + r1.width / 2
    const r1CenterY = r1.y + r1.height / 2
    const r2CenterX = r2.x + r2.width / 2
    const r2CenterY = r2.y + r2.height / 2

    const r1HalfWidth = r1.width / 2
    const r1HalfHeight = r1.height / 2
    const r2HalfWidth = r2.width / 2
    const r2HalfHeight = r2.height / 2

    const vx = r1CenterX - r2CenterX
    const vy = r1CenterY - r2CenterY

    const combinedHalfWidths = r1HalfWidth + r2HalfWidth
    const combinedHalfHeights = r1HalfHeight + r2HalfHeight

    if (Math.abs(vx) < combinedHalfWidths) {
      if (Math.abs(vy) < combinedHalfHeights) {
        return true
      }
      return false
    }
    return false
  }

  // Pixel-space collision check between a rectangle and models (using models' pixel position/size)
  hasPixelOverlap(
    rect: { x: number; y: number; width: number; height: number },
    models: GameModel[],
    excludeId?: string,
  ): boolean {
    for (const model of models) {
      if (excludeId && model.id === excludeId) continue
      const modelRect = {
        x: (model as any).position?.x ?? this.gridToPixel(model.gridPosition).x,
        y: (model as any).position?.y ?? this.gridToPixel(model.gridPosition).y,
        width: (model as any).size?.width ?? model.gridSize.gridWidth * this.tileSize,
        height: (model as any).size?.height ?? model.gridSize.gridHeight * this.tileSize,
      }
      if (CollisionDetector.hitTestAABB(rect, modelRect)) {
        return true
      }
    }
    return false
  }
}
