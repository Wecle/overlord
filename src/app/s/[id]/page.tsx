"use client"

/*
 * 短链接分享页面组件
 * 
 * 该组件负责处理通过分享链接重新进入地图的功能
 * 主要功能：
 * 1. 从URL参数中获取分享ID
 * 2. 调用API获取对应的分享数据
 * 3. 解码分享数据，提取模型和地图配置
 * 4. 根据加载状态显示不同界面（加载中、错误、游戏界面）
 * 5. 使用GameRunner组件渲染游戏内容
 */
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { GameRunner } from "@/components/GameRunner/GameRunner"
import { decodeSharePayload } from "@/utils/share"

export default function ShortPlayPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [models, setModels] = useState<any[]>([])
  const [mapConfig, setMapConfig] = useState<any | null>(null)

  useEffect(() => {
    const run = async () => {
      const id = params?.id
      if (!id) {
        setError("缺少分享ID")
        return
      }
      try {
        const res = await fetch(`/api/share/${id}`)
        if (!res.ok) throw new Error("短链接不存在或已失效")
        const data = await res.json()
        const payload = decodeSharePayload(data?.d)
        if (!payload) throw new Error("分享数据无效")
        setModels(payload.models || [])
        setMapConfig(payload.mapConfig)
        setReady(true)
      } catch (e: any) {
        setError(e?.message || "加载失败")
      }
    }
    run()
  }, [params?.id])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="text-lg">{error}</div>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-white/10 rounded hover:bg-white/20">返回首页</button>
        </div>
      </div>
    )
  }

  if (!ready || !mapConfig) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <GameRunner models={models} mapConfig={mapConfig} hideUI showInfoPanel />
    </div>
  )
}


