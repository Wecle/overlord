"use client"

import { useEffect, useRef } from "react"
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js"

export default function FarmGame() {
  const gameRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const playerRef = useRef<Graphics | null>(null)
  const keysRef = useRef<{ [key: string]: boolean }>({})
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!gameRef.current || isInitializedRef.current) return

    console.log("Initializing PixiJS game...")
    isInitializedRef.current = true

    const app = new Application()
    appRef.current = app

    const initGame = async () => {
      try {
        await app.init({
          width: 800,
          height: 600,
          backgroundColor: 0x87ceeb, // 天空蓝色
          antialias: true,
        })

        if (gameRef.current) {
          gameRef.current.innerHTML = "" // 清空容器
          gameRef.current.appendChild(app.canvas)
        }

        createScene(app)
        createPlayer(app)
        setupControls()

        app.ticker.add(gameLoop)

        console.log("Game initialized successfully")
      } catch (error) {
        console.error("Error initializing game:", error)
      }
    }

    initGame()

    return () => {
      console.log("Cleaning up PixiJS game...")
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true })
        appRef.current = null
      }
      playerRef.current = null
      keysRef.current = {}
      isInitializedRef.current = false

      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  const handleKeyDown = (e: KeyboardEvent) => {
    keysRef.current[e.code] = true
  }

  const handleKeyUp = (e: KeyboardEvent) => {
    keysRef.current[e.code] = false
  }

  const createScene = (app: Application) => {
    const ground = new Graphics()
    ground.rect(0, 400, 800, 200)
    ground.fill(0x90ee90) // 浅绿色草地
    app.stage.addChild(ground)

    const path = new Graphics()
    path.rect(350, 400, 100, 200)
    path.fill(0xdeb887) // 土黄色小径
    app.stage.addChild(path)

    for (let i = 0; i < 5; i++) {
      const tree = createTree()
      tree.x = 100 + i * 150
      tree.y = 350
      app.stage.addChild(tree)
    }

    const house = createHouse()
    house.x = 600
    house.y = 250
    app.stage.addChild(house)

    for (let i = 0; i < 3; i++) {
      const cloud = createCloud()
      cloud.x = 150 + i * 250
      cloud.y = 50 + Math.random() * 50
      app.stage.addChild(cloud)
    }

    const titleStyle = new TextStyle({
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0x2f4f4f,
      fontWeight: "bold",
    })
    const title = new Text({ text: "田园小游戏 - 使用方向键移动", style: titleStyle })
    title.x = 250
    title.y = 20
    app.stage.addChild(title)
  }

  const createTree = () => {
    const tree = new Container()

    const trunk = new Graphics()
    trunk.rect(-10, -30, 20, 60)
    trunk.fill(0x8b4513) // 棕色
    tree.addChild(trunk)

    const crown = new Graphics()
    crown.circle(0, -50, 40)
    crown.fill(0x228b22) // 森林绿
    tree.addChild(crown)

    return tree
  }

  const createHouse = () => {
    const house = new Container()

    const body = new Graphics()
    body.rect(-50, -40, 100, 80)
    body.fill(0xdeb887) // 浅棕色
    house.addChild(body)

    const roof = new Graphics()
    roof.moveTo(-60, -40)
    roof.lineTo(0, -80)
    roof.lineTo(60, -40)
    roof.closePath()
    roof.fill(0x8b0000) // 深红色
    house.addChild(roof)

    const door = new Graphics()
    door.rect(-15, -10, 30, 50)
    door.fill(0x654321) // 深棕色
    house.addChild(door)

    const window1 = new Graphics()
    window1.rect(-35, -25, 20, 20)
    window1.fill(0x87ceeb) // 天空蓝
    house.addChild(window1)

    const window2 = new Graphics()
    window2.rect(15, -25, 20, 20)
    window2.fill(0x87ceeb)
    house.addChild(window2)

    return house
  }

  const createCloud = () => {
    const cloud = new Container()

    const circles = [
      { x: 0, y: 0, r: 20 },
      { x: 25, y: 0, r: 25 },
      { x: 50, y: 0, r: 20 },
      { x: 12, y: -15, r: 18 },
      { x: 38, y: -15, r: 18 },
    ]

    circles.forEach(({ x, y, r }) => {
      const circle = new Graphics()
      circle.circle(x, y, r)
      circle.fill(0xffffff) // 白色
      cloud.addChild(circle)
    })

    return cloud
  }

  const createPlayer = (app: Application) => {
    const player = new Graphics()

    player.circle(0, 0, 15)
    player.fill(0xff6b6b) // 粉红色身体

    const head = new Graphics()
    head.circle(0, -25, 12)
    head.fill(0xffdbb5) // 肤色
    player.addChild(head)

    const leftEye = new Graphics()
    leftEye.circle(-5, -25, 2)
    leftEye.fill(0x000000)
    player.addChild(leftEye)

    const rightEye = new Graphics()
    rightEye.circle(5, -25, 2)
    rightEye.fill(0x000000)
    player.addChild(rightEye)

    player.x = 400
    player.y = 500

    playerRef.current = player
    app.stage.addChild(player)
  }

  const setupControls = () => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
  }

  const gameLoop = () => {
    if (!playerRef.current) return

    const player = playerRef.current
    const speed = 3

    if (keysRef.current["ArrowLeft"] || keysRef.current["KeyA"]) {
      player.x = Math.max(20, player.x - speed)
    }
    if (keysRef.current["ArrowRight"] || keysRef.current["KeyD"]) {
      player.x = Math.min(780, player.x + speed)
    }
    if (keysRef.current["ArrowUp"] || keysRef.current["KeyW"]) {
      player.y = Math.max(80, player.y - speed)
    }
    if (keysRef.current["ArrowDown"] || keysRef.current["KeyS"]) {
      player.y = Math.min(580, player.y + speed)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-200 to-green-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6">
        <div
          ref={gameRef}
          className="border-4 border-green-600 rounded-lg overflow-hidden"
          style={{ width: "800px", height: "600px" }}
        />
        <div className="mt-4 text-center text-gray-700">
          <p className="text-sm">使用方向键 ↑↓←→ 或 WASD 键移动人物</p>
          <p className="text-xs text-gray-500 mt-1">在美丽的田园场景中自由探索吧！</p>
        </div>
      </div>
    </div>
  )
}
