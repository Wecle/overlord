import { type MapConfig, WeatherType } from "@/types/mapEditor"

export const DEFAULT_MAP_CONFIG: MapConfig = {
  id: "forest-village",
  name: "森林村庄",
  width: 1024,
  height: 768,
  tileSize: 32,
  gridWidth: 32,
  gridHeight: 24,
  backgroundType: "forest",
  weather: WeatherType.SUNNY,
}

export const PRESET_MAPS: MapConfig[] = [
  DEFAULT_MAP_CONFIG,
  {
    id: "desert-oasis",
    name: "沙漠绿洲",
    width: 1024,
    height: 768,
    tileSize: 32,
    gridWidth: 32,
    gridHeight: 24,
    backgroundType: "desert",
    weather: WeatherType.SUNNY,
  },
  {
    id: "snowy-mountain",
    name: "雪山",
    width: 1024,
    height: 768,
    tileSize: 32,
    gridWidth: 32,
    gridHeight: 24,
    backgroundType: "snow",
    weather: WeatherType.SNOWY,
  },
]
