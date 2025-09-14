"use client"

import { useState, useCallback, useRef, useMemo } from "react"
import * as PIXI from "pixi.js"
import { type WeatherConfig, type UseWeatherReturn, WeatherType } from "@/types/mapEditor"

interface WeatherParticle {
  sprite: PIXI.Graphics
  vx: number
  vy: number
  life: number
  maxLife: number
}

export function useWeather(app?: PIXI.Application): UseWeatherReturn {
  const [weather, setWeatherState] = useState<WeatherConfig>({
    type: WeatherType.SUNNY,
    intensity: 0.5,
    particleCount: 100,
    windSpeed: 1,
    opacity: 0.7,
  })

  const weatherContainerRef = useRef<PIXI.Container | null>(null)
  const particlesRef = useRef<WeatherParticle[]>([])
  const animationFrameRef = useRef<number | null>(null)

  const weatherEffects = useMemo(() => {
    if (!app) return null

    const container = new PIXI.Container()
    weatherContainerRef.current = container

    return container
  }, [app])

  const createRainParticle = useCallback(
    (container: PIXI.Container, screenWidth: number, screenHeight: number) => {
      const particle = new PIXI.Graphics()
      particle.beginFill(0x87ceeb, weather.opacity)
      particle.drawRect(0, 0, 2, 8 + Math.random() * 4)
      particle.endFill()

      particle.x = Math.random() * (screenWidth + 100) - 50
      particle.y = -20
      particle.rotation = Math.PI * 0.1 * weather.windSpeed

      const weatherParticle: WeatherParticle = {
        sprite: particle,
        vx: weather.windSpeed * (0.5 + Math.random() * 0.5),
        vy: 4 + Math.random() * 4 + weather.intensity * 6,
        life: 0,
        maxLife: screenHeight / (4 + weather.intensity * 6) + 50,
      }

      container.addChild(particle)
      return weatherParticle
    },
    [weather],
  )

  const createSnowParticle = useCallback(
    (container: PIXI.Container, screenWidth: number, screenHeight: number) => {
      const particle = new PIXI.Graphics()
      const size = 2 + Math.random() * 3
      particle.beginFill(0xffffff, weather.opacity * 0.8)
      particle.drawCircle(0, 0, size)
      particle.endFill()

      particle.x = Math.random() * (screenWidth + 100) - 50
      particle.y = -20

      const weatherParticle: WeatherParticle = {
        sprite: particle,
        vx: weather.windSpeed * (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 2 + weather.intensity * 2,
        life: 0,
        maxLife: screenHeight / (1 + weather.intensity * 2) + 100,
      }

      container.addChild(particle)
      return weatherParticle
    },
    [weather],
  )

  const createCloudParticle = useCallback(
    (container: PIXI.Container, screenWidth: number, screenHeight: number) => {
      const particle = new PIXI.Graphics()
      const width = 40 + Math.random() * 60
      const height = 20 + Math.random() * 30

      particle.beginFill(0x808080, weather.opacity * 0.3)
      particle.drawEllipse(0, 0, width, height)
      particle.endFill()

      particle.x = Math.random() * screenWidth
      particle.y = Math.random() * (screenHeight * 0.3)

      const weatherParticle: WeatherParticle = {
        sprite: particle,
        vx: weather.windSpeed * 0.5,
        vy: 0,
        life: 0,
        maxLife: 1000 + Math.random() * 2000,
      }

      container.addChild(particle)
      return weatherParticle
    },
    [weather],
  )

  const updateWeatherEffects = useCallback(() => {
    if (!weatherContainerRef.current || !app) return

    const container = weatherContainerRef.current
    const particles = particlesRef.current
    const screenWidth = app.screen.width
    const screenHeight = app.screen.height

    // Update existing particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i]
      particle.life++

      // Update position
      particle.sprite.x += particle.vx
      particle.sprite.y += particle.vy

      // Add some variation for snow
      if (weather.type === WeatherType.SNOWY) {
        particle.sprite.x += Math.sin(particle.life * 0.01) * 0.5
      }

      // Remove particles that are out of bounds or expired
      if (
        particle.sprite.y > screenHeight + 50 ||
        particle.sprite.x > screenWidth + 100 ||
        particle.sprite.x < -100 ||
        particle.life > particle.maxLife
      ) {
        container.removeChild(particle.sprite)
        particles.splice(i, 1)
      }
    }

    // Add new particles based on weather type and intensity
    if (weather.type !== WeatherType.SUNNY && particles.length < weather.particleCount) {
      const particlesToAdd = Math.min(Math.ceil(weather.intensity * 5), weather.particleCount - particles.length)

      for (let i = 0; i < particlesToAdd; i++) {
        let newParticle: WeatherParticle

        switch (weather.type) {
          case WeatherType.RAINY:
            newParticle = createRainParticle(container, screenWidth, screenHeight)
            break
          case WeatherType.SNOWY:
            newParticle = createSnowParticle(container, screenWidth, screenHeight)
            break
          case WeatherType.CLOUDY:
            if (Math.random() < 0.1) {
              // Less frequent cloud generation
              newParticle = createCloudParticle(container, screenWidth, screenHeight)
            } else {
              continue
            }
            break
          default:
            continue
        }

        particles.push(newParticle)
      }
    }

    // Continue animation
    if (weather.type !== WeatherType.SUNNY) {
      animationFrameRef.current = requestAnimationFrame(updateWeatherEffects)
    }
  }, [weather, app, createRainParticle, createSnowParticle, createCloudParticle])

  const setWeather = useCallback(
    (config: WeatherConfig) => {
      setWeatherState(config)

      // Clear existing particles when weather changes
      if (weatherContainerRef.current) {
        const particles = particlesRef.current
        particles.forEach((particle) => {
          weatherContainerRef.current!.removeChild(particle.sprite)
        })
        particlesRef.current = []
      }

      // Cancel existing animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      // Start new weather effects
      if (config.type !== WeatherType.SUNNY) {
        updateWeatherEffects()
      }
    },
    [updateWeatherEffects],
  )

  const initializeWeather = useCallback(
    (pixiApp: PIXI.Application) => {
      if (!weatherContainerRef.current) {
        const container = new PIXI.Container()
        weatherContainerRef.current = container
        pixiApp.stage.addChild(container)
      }

      // Start weather effects if not sunny
      if (weather.type !== WeatherType.SUNNY && !animationFrameRef.current) {
        updateWeatherEffects()
      }
    },
    [weather.type, updateWeatherEffects],
  )

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (weatherContainerRef.current) {
      const particles = particlesRef.current
      particles.forEach((particle) => {
        weatherContainerRef.current!.removeChild(particle.sprite)
      })
      particlesRef.current = []
    }
  }, [])

  return {
    weather,
    setWeather,
    weatherEffects: weatherContainerRef.current,
    updateWeatherEffects,
    initializeWeather,
    cleanup,
  }
}
