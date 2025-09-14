"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { WeatherType, type WeatherConfig } from "@/types/mapEditor"

interface WeatherControlProps {
  weather: WeatherConfig
  onWeatherChange: (config: WeatherConfig) => void
}

const WEATHER_OPTIONS = [
  { value: WeatherType.SUNNY, label: "晴天", icon: "☀️", description: "明亮的阳光" },
  { value: WeatherType.RAINY, label: "雨天", icon: "🌧️", description: "下雨天气" },
  { value: WeatherType.DUST, label: "沙尘", icon: "🌫️", description: "沙尘漫天" },
  { value: WeatherType.SNOWY, label: "雪天", icon: "❄️", description: "飘雪天气" },
]

export function WeatherControl({ weather, onWeatherChange }: WeatherControlProps) {
  const currentWeatherOption = WEATHER_OPTIONS.find((option) => option.value === weather.type)

  const handleWeatherTypeChange = (type: WeatherType) => {
    onWeatherChange({ ...weather, type })
  }

  const handleIntensityChange = (intensity: number[]) => {
    onWeatherChange({ ...weather, intensity: intensity[0] })
  }

  const handleParticleCountChange = (particleCount: number[]) => {
    onWeatherChange({ ...weather, particleCount: particleCount[0] })
  }

  const handleWindSpeedChange = (windSpeed: number[]) => {
    onWeatherChange({ ...weather, windSpeed: windSpeed[0] })
  }

  const handleOpacityChange = (opacity: number[]) => {
    onWeatherChange({ ...weather, opacity: opacity[0] })
  }

  const WEATHER_STYLES: Record<string, { ring: string; bg: string; text: string; from: string; to: string; bar: string }> = {
    [WeatherType.SUNNY]: {
      ring: "ring-amber-300",
      bg: "bg-amber-50/60",
      text: "text-amber-700",
      from: "from-amber-100/60",
      to: "to-transparent",
      bar: "bg-amber-400",
    },
    [WeatherType.RAINY]: {
      ring: "ring-sky-300",
      bg: "bg-sky-50/60",
      text: "text-sky-700",
      from: "from-sky-100/60",
      to: "to-transparent",
      bar: "bg-sky-400",
    },
    [WeatherType.DUST]: {
      ring: "ring-amber-200",
      bg: "bg-amber-50/60",
      text: "text-amber-700",
      from: "from-amber-100/60",
      to: "to-transparent",
      bar: "bg-amber-300",
    },
    [WeatherType.SNOWY]: {
      ring: "ring-cyan-300",
      bg: "bg-cyan-50/60",
      text: "text-cyan-700",
      from: "from-cyan-100/60",
      to: "to-transparent",
      bar: "bg-cyan-400",
    },
  }

  const accent = WEATHER_STYLES[weather.type] ?? WEATHER_STYLES[WeatherType.SUNNY]

  return (
    <Card className={`relative gap-4 overflow-hidden ring-1 shrink-0 ${accent.ring}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent.from} ${accent.to}`} />
      <CardHeader className="relative">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${accent.bg}`}>
              <span className="text-lg">{currentWeatherOption?.icon}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-medium">天气控制</span>
              {currentWeatherOption && (
                <span className="text-xs text-muted-foreground">{currentWeatherOption.description}</span>
              )}
            </div>
          </div>
          {currentWeatherOption && (
            <Badge variant="secondary" className={`flex items-center gap-1 px-2 py-1 ${accent.bg} ${accent.text}`}>
              <span>{currentWeatherOption.icon}</span>
              <span>{currentWeatherOption.label}</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-6">
        <div className="space-y-2">
          <Label className="py-1" htmlFor="weather-type">天气类型</Label>
          <div className="grid grid-cols-4 gap-2">
            {WEATHER_OPTIONS.map((option) => {
              const optionAccent = WEATHER_STYLES[option.value]
              const selected = weather.type === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => handleWeatherTypeChange(option.value)}
                  className={`group flex items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-sm transition-all
                    ${selected ? `${optionAccent.bg} ${optionAccent.ring} ring-2` : "hover:bg-muted/60"}`}
                >
                  <span>{option.icon}</span>
                  <span className="truncate">{option.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {weather.type !== WeatherType.SUNNY ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="intensity">强度</Label>
                <Badge variant="outline" className={`${accent.bg} ${accent.text}`}>{Math.round(weather.intensity * 100)}%</Badge>
              </div>
              <div className="h-1.5 w-full rounded bg-muted/50">
                <div className={`h-full rounded ${accent.bar}`} style={{ width: `${weather.intensity * 100}%` }} />
              </div>
              <Slider
                id="intensity"
                min={0}
                max={1}
                step={0.1}
                value={[weather.intensity]}
                onValueChange={handleIntensityChange}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="particle-count">粒子数量</Label>
                <Badge variant="outline" className={`${accent.bg} ${accent.text}`}>{weather.particleCount}</Badge>
              </div>
              <div className="h-1.5 w-full rounded bg-muted/50">
                <div className={`h-full rounded ${accent.bar}`} style={{ width: `${((weather.particleCount - 10) / (500 - 10)) * 100}%` }} />
              </div>
              <Slider
                id="particle-count"
                min={10}
                max={500}
                step={10}
                value={[weather.particleCount]}
                onValueChange={handleParticleCountChange}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="wind-speed">风速</Label>
                <Badge variant="outline" className={`${accent.bg} ${accent.text}`}>{weather.windSpeed.toFixed(1)}</Badge>
              </div>
              <div className="h-1.5 w-full rounded bg-muted/50">
                <div className={`h-full rounded ${accent.bar}`} style={{ width: `${(weather.windSpeed / 5) * 100}%` }} />
              </div>
              <Slider
                id="wind-speed"
                min={0}
                max={5}
                step={0.1}
                value={[weather.windSpeed]}
                onValueChange={handleWindSpeedChange}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="opacity">透明度</Label>
                <Badge variant="outline" className={`${accent.bg} ${accent.text}`}>{Math.round(weather.opacity * 100)}%</Badge>
              </div>
              <div className="h-1.5 w-full rounded bg-muted/50">
                <div className={`h-full rounded ${accent.bar}`} style={{ width: `${weather.opacity * 100}%` }} />
              </div>
              <Slider
                id="opacity"
                min={0.1}
                max={1}
                step={0.1}
                value={[weather.opacity]}
                onValueChange={handleOpacityChange}
                className="mt-1"
              />
            </div>
          </>
        ) : (
          <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            当前为晴天，部分高级参数已隐藏。切换为其他天气可调节强度、粒子、风速与透明度。
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {currentWeatherOption?.description}
        </div>
      </CardContent>
    </Card>
  )
}
