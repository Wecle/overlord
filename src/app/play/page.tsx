"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { GameRunner } from "@/components/GameRunner/GameRunner"
import { decodeSharePayload, createShortLink } from "@/utils/share"

function PlayPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [models, setModels] = useState<any[]>([])
  const [mapConfig, setMapConfig] = useState<any | null>(null)

  const dataParam = useMemo(() => searchParams.get("d"), [searchParams])

  useEffect(() => {
    const init = () => {
      if (!dataParam) {
        setError("缺少分享数据参数")
        return
      }
      // 若参数过长，先尝试生成短链并重定向
      if (dataParam.length > 200) {
        createShortLink(dataParam).then((shortPath) => {
          if (shortPath) {
            router.replace(shortPath)
            return
          }
          // 回退到直接解码
          const payload = decodeSharePayload(dataParam)
          if (!payload) {
            setError("分享数据无效或已损坏")
            return
          }
          setModels(payload.models || [])
          setMapConfig(payload.mapConfig)
          setReady(true)
        })
        return
      }
      const payload = decodeSharePayload(dataParam)
      if (!payload) {
        setError("分享数据无效或已损坏")
        return
      }

      setModels(payload.models || [])
      setMapConfig(payload.mapConfig)
      setReady(true)
    }
    init()
  }, [dataParam])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <div className="text-lg">{error}</div>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-white/10 rounded hover:bg-white/20"
          >
            返回首页
          </button>
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

  // 全屏纯游玩：隐藏状态栏等UI，由 GameRunner 支持 hideUI
  return (
    <div className="min-h-screen bg-black">
      <GameRunner models={models} mapConfig={mapConfig} hideUI showInfoPanel />
    </div>
  )
}

export default function PlayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="text-white">加载中...</div></div>}>
      <PlayPageContent />
    </Suspense>
  )
}


