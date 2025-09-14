export interface Position {
  x: number
  y: number
}

export interface GridPosition {
  gridX: number
  gridY: number
}

export interface Size {
  width: number
  height: number
}

export interface GridSize {
  gridWidth: number
  gridHeight: number
}

// Model Categories
export enum ModelCategory {
  CHARACTER = "character",
  PLANT = "plant",
  BUILDING = "building",
}

// Character Template IDs
export enum CharacterTemplateId {
  MERCHANT = "npc-merchant",
  GUARD = "npc-guard",
  VILLAGER = "npc-villager",
  ELDER = "npc-elder",
  CHILD = "npc-child",
  ARTISAN = "npc-artisan",
}

// Weather Types
export enum WeatherType {
  SUNNY = "sunny",
  RAINY = "rainy",
  DUST = "dust",
  SNOWY = "snowy",
}

// Base Model Interface
export interface BaseModel {
  id: string
  name: string
  category: ModelCategory
  position: Position
  gridPosition: GridPosition
  size: Size
  gridSize: GridSize
  sprite?: string // For future sprite support
  isPlaced: boolean
}

// Character-specific properties
export interface CharacterModel extends BaseModel {
  category: ModelCategory.CHARACTER
  characterName: string
  canDialogue: boolean
  defaultDialogue: string
  aiPrompt: string
  isInteractable: boolean
  characterColor?: string // Character color for UI styling
  templateId?: CharacterTemplateId // Template ID for AI prompt mapping
}

// Plant-specific properties
export interface PlantModel extends BaseModel {
  category: ModelCategory.PLANT
  plantType: string
  growthStage: number
  isHarvestable: boolean
}

// Building-specific properties
export interface BuildingModel extends BaseModel {
  category: ModelCategory.BUILDING
  buildingType: string
  isEnterable: boolean
  capacity?: number
}

// Union type for all models
export type GameModel = CharacterModel | PlantModel | BuildingModel

// Map Configuration
export interface MapConfig {
  id: string
  name: string
  width: number
  height: number
  tileSize: number
  gridWidth: number
  gridHeight: number
  backgroundType: string
  weather: WeatherType
  weatherConfig?: WeatherConfig
}

// Preset Model Templates
export interface ModelTemplate {
  id: string
  name: string
  category: ModelCategory
  defaultSize: Size
  defaultGridSize: GridSize
  icon: string
  description: string
}

// Editor State
export interface EditorState {
  selectedTool: "select" | "place" | "delete"
  selectedTemplate: ModelTemplate | null
  selectedModel: GameModel | null
  isPlacing: boolean
  showGrid: boolean
  showCollisions: boolean
}

// Collision Detection
export interface CollisionBounds {
  x: number
  y: number
  width: number
  height: number
}

// Chat Configuration
export interface ChatConfig {
  modelProvider: string
  systemPrompt: string
  temperature: number
  maxTokens: number
}

// Weather Configuration
export interface WeatherConfig {
  type: WeatherType
  intensity: number
  particleCount: number
  windSpeed: number
  opacity: number
}

// Map Editor Props
export interface MapEditorProps {
  initialMap?: MapConfig
  onSave?: (models: GameModel[], mapConfig: MapConfig) => void
  onLoad?: () => { models: GameModel[]; mapConfig: MapConfig }
  isSaving?: boolean
}

// Hook Return Types
export interface UseMapReturn {
  mapConfig: MapConfig
  setMapConfig: (config: MapConfig) => void
  gridToPixel: (gridPos: GridPosition) => Position
  pixelToGrid: (pixelPos: Position) => GridPosition
  isValidGridPosition: (gridPos: GridPosition, gridSize: GridSize) => boolean
}

export interface UseModelsReturn {
  models: GameModel[]
  addModel: (template: ModelTemplate, position: Position) => string
  updateModel: (id: string, updates: Partial<GameModel>) => void
  removeModel: (id: string) => void
  getModelAt: (gridPos: GridPosition) => GameModel | null
  checkCollision: (gridPos: GridPosition, gridSize: GridSize, excludeId?: string) => boolean
  getCollisionInfo: (gridPos: GridPosition, gridSize: GridSize, excludeId?: string) => any
  getCollisionVisualization: () => any
  undo: () => void
  redo: () => void
  reset: () => void
  canUndo: boolean
  canRedo: boolean
  clearHistory: () => void
}

export interface UseWeatherReturn {
  weather: WeatherConfig
  setWeather: (config: WeatherConfig) => void
  weatherEffects: any // PIXI objects for weather effects
  updateWeatherEffects: () => void
  initializeWeather: (app: any) => void
  cleanup: () => void
}

export interface UseChatReturn {
  openChat: (character: CharacterModel) => void
  closeChat: () => void
  isOpen: boolean
  currentCharacter: CharacterModel | null
  sendMessage: (message: string) => void
  messages: any[]
  isLoading: boolean
}
