"use client"

interface LoadingOverlayProps {
  open: boolean
  message?: string
}

export default function LoadingOverlay({ open, message = "加载中…" }: LoadingOverlayProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-lg px-6 py-4 shadow-lg flex items-center gap-3">
        <div className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
        <div className="text-sm text-gray-700">{message}</div>
      </div>
    </div>
  )
}


