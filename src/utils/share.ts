"use client"

import type { GameModel, MapConfig } from "@/types/mapEditor"

export interface SharePayload {
  name?: string
  mapConfig: MapConfig
  models: GameModel[]
}

// 处理Unicode的base64编码/解码
function base64EncodeUnicode(str: string): string {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
  } catch {
    return ""
  }
}

function base64DecodeUnicode(str: string): string {
  try {
    return decodeURIComponent(Array.prototype.map
      .call(atob(str), (c: string) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join(""))
  } catch {
    return ""
  }
}

// 轻量级“瘦身”编码：将键名缩短、数组化坐标尺寸、移除默认值
type MinMapConfig = Partial<{
  i: string; // id
  n: string; // name
  w: number; // width
  h: number; // height
  t: number; // tileSize
  gw: number; // gridWidth
  gh: number; // gridHeight
  b: string; // backgroundType
  we: string; // weather
  wc: [string, number, number, number, number]; // weatherConfig: [type,intensity,particleCount,windSpeed,opacity]
}>

type MinGameModel = {
  i: string; // id
  n: string; // name
  c: string; // category: c/p/b
  p: [number, number]; // position
  gp?: [number, number]; // gridPosition
  s: [number, number]; // size
  gs?: [number, number]; // gridSize
  ip?: boolean; // isPlaced
  ia?: boolean; // isInteractable
  cd?: boolean; // canDialogue
  cn?: string; // characterName
  dd?: string; // defaultDialogue
  ap?: string; // aiPrompt
}

type MinPayload = {
  n?: string; // name
  m: MinMapConfig; // mapConfig
  o: MinGameModel[]; // models
}

const DEFAULTS = {
  width: 1024,
  height: 768,
  tileSize: 32,
  backgroundType: "grass",
  weather: "sunny",
}
const DEFAULT_WEATHER = {
  type: "sunny",
  intensity: 0.5,
  particleCount: 200,
  windSpeed: 1,
  opacity: 0.8,
}

function toMinMapConfig(m: MapConfig): MinMapConfig {
  const out: MinMapConfig = {}
  if (m.id) out.i = m.id
  if (m.name) out.n = m.name
  if (m.width !== DEFAULTS.width) out.w = m.width
  if (m.height !== DEFAULTS.height) out.h = m.height
  if (m.tileSize !== DEFAULTS.tileSize) out.t = m.tileSize
  if (m.gridWidth) out.gw = m.gridWidth
  if (m.gridHeight) out.gh = m.gridHeight
  if (m.backgroundType && m.backgroundType !== DEFAULTS.backgroundType) out.b = m.backgroundType
  if (m.weather && (m.weather as any) !== DEFAULTS.weather) out.we = m.weather as any
  if (m.weatherConfig) out.wc = [
    (m.weatherConfig.type as any) ?? (m.weather as any) ?? DEFAULT_WEATHER.type,
    m.weatherConfig.intensity ?? DEFAULT_WEATHER.intensity,
    m.weatherConfig.particleCount ?? DEFAULT_WEATHER.particleCount,
    m.weatherConfig.windSpeed ?? DEFAULT_WEATHER.windSpeed,
    m.weatherConfig.opacity ?? DEFAULT_WEATHER.opacity,
  ]
  return out
}

function fromMinMapConfig(mm: MinMapConfig): MapConfig {
  const width = mm.w ?? DEFAULTS.width
  const height = mm.h ?? DEFAULTS.height
  const tileSize = mm.t ?? DEFAULTS.tileSize
  const weatherType = (mm.we as any) ?? (DEFAULTS.weather as any)
  const weatherConfig = mm.wc
    ? {
        type: (mm.wc[0] as any) ?? weatherType,
        intensity: mm.wc[1] ?? DEFAULT_WEATHER.intensity,
        particleCount: mm.wc[2] ?? DEFAULT_WEATHER.particleCount,
        windSpeed: mm.wc[3] ?? DEFAULT_WEATHER.windSpeed,
        opacity: mm.wc[4] ?? DEFAULT_WEATHER.opacity,
      }
    : {
        type: weatherType as any,
        intensity: DEFAULT_WEATHER.intensity,
        particleCount: DEFAULT_WEATHER.particleCount,
        windSpeed: DEFAULT_WEATHER.windSpeed,
        opacity: DEFAULT_WEATHER.opacity,
      }
  return {
    id: mm.i ?? "",
    name: mm.n ?? "",
    width,
    height,
    tileSize,
    gridWidth: mm.gw ?? Math.floor(width / tileSize),
    gridHeight: mm.gh ?? Math.floor(height / tileSize),
    backgroundType: mm.b ?? DEFAULTS.backgroundType,
    weather: weatherType as any,
    weatherConfig,
  } as MapConfig
}

function categoryToShort(c: GameModel["category"]): string {
  switch (c) {
    case "character":
    case ("CHARACTER" as any):
      return "c"
    case "plant":
    case ("PLANT" as any):
      return "p"
    case "building":
    case ("BUILDING" as any):
      return "b"
    default:
      return "c"
  }
}

function shortToCategory(s: string): any {
  switch (s) {
    case "c":
      return "character"
    case "p":
      return "plant"
    case "b":
      return "building"
    default:
      return "character"
  }
}

function toMinModel(m: GameModel): MinGameModel {
  const out: MinGameModel = {
    i: m.id,
    n: m.name,
    c: categoryToShort(m.category as any),
    p: [m.position.x, m.position.y],
    s: [m.size.width, m.size.height],
  }
  if ((m as any).gridPosition) out.gp = [(m as any).gridPosition.gridX, (m as any).gridPosition.gridY]
  if ((m as any).gridSize) out.gs = [(m as any).gridSize.gridWidth, (m as any).gridSize.gridHeight]
  if ((m as any).isPlaced) out.ip = true
  if ((m as any).isInteractable) out.ia = true
  if ((m as any).canDialogue) out.cd = true
  if ((m as any).characterName) out.cn = (m as any).characterName
  if ((m as any).defaultDialogue) out.dd = (m as any).defaultDialogue
  if ((m as any).aiPrompt) out.ap = (m as any).aiPrompt
  return out
}

function fromMinModel(mm: MinGameModel): GameModel {
  const base: any = {
    id: mm.i,
    name: mm.n,
    category: shortToCategory(mm.c),
    position: { x: mm.p[0], y: mm.p[1] },
    size: { width: mm.s[0], height: mm.s[1] },
  }
  if (mm.gp) base.gridPosition = { gridX: mm.gp[0], gridY: mm.gp[1] }
  if (mm.gs) base.gridSize = { gridWidth: mm.gs[0], gridHeight: mm.gs[1] }
  if (mm.ip) base.isPlaced = true
  if (mm.ia) base.isInteractable = true
  if (mm.cd) base.canDialogue = true
  if (mm.cn) base.characterName = mm.cn
  if (mm.dd) base.defaultDialogue = mm.dd
  if (mm.ap) base.aiPrompt = mm.ap
  return base as GameModel
}

function toMinPayload(p: SharePayload): MinPayload {
  return {
    n: p.name,
    m: toMinMapConfig(p.mapConfig),
    o: p.models.map(toMinModel),
  }
}

function fromMinPayload(mp: MinPayload): SharePayload {
  return {
    name: mp.n,
    mapConfig: fromMinMapConfig(mp.m),
    models: (mp.o || []).map(fromMinModel),
  }
}

export function encodeSharePayload(payload: SharePayload): string {
  const minified = JSON.stringify(toMinPayload(payload))
  const b64 = base64EncodeUnicode(minified)
  return `x${b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")}`
}

export function decodeSharePayload(param: string): SharePayload | null {
  try {
    if (!param || param.length < 2) return null
    const tag = param[0]
    const body = param.slice(1)

    // 新版瘦身格式：base64(minified-json)
    if (tag === "x") {
      let b64 = body.replace(/-/g, "+").replace(/_/g, "/")
      const pad = b64.length % 4
      if (pad) b64 += "=".repeat(4 - pad)
      const json = base64DecodeUnicode(b64)
      const min = JSON.parse(json) as MinPayload
      return fromMinPayload(min)
    }

    // 兼容旧版 base64（完整JSON）
    const raw = tag === "b" ? body : param
    let b64 = raw.replace(/-/g, "+").replace(/_/g, "/")
    const pad = b64.length % 4
    if (pad) b64 += "=".repeat(4 - pad)
    const json = base64DecodeUnicode(b64)
    const data = JSON.parse(json)
    if (!data || !data.mapConfig || !data.models) return null
    return data as SharePayload
  } catch (e) {
    console.error("decodeSharePayload error", e)
    return null
  }
}

export function buildPlayUrlFromEncoded(d: string): string {
  return `/play?d=${d}`
}

export async function createShortLink(d: string): Promise<string> {
  try {
    const res = await fetch(`/api/share/shorten`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ d }),
    })
    if (!res.ok) throw new Error("短链创建失败")
    const data = await res.json()
    return data?.url || ""
  } catch (e) {
    return ""
  }
}



