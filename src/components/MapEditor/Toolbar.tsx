"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { MousePointer, Hand, Trash2, Grid3X3, Eye, EyeOff, Save, FolderOpen, Undo, Redo, RotateCcw, Home } from "lucide-react"
import type { EditorState } from "@/types/mapEditor"

interface ToolbarProps {
  editorState: EditorState
  onToolChange: (tool: EditorState["selectedTool"]) => void
  onToggleGrid: () => void
  onToggleCollisions: () => void
  onSave?: () => void
  onLoad?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onReset?: () => void
  onShare?: () => void
  canUndo?: boolean
  canRedo?: boolean
  isSaving?: boolean
}

export function Toolbar({
  editorState,
  onToolChange,
  onToggleGrid,
  onToggleCollisions,
  onSave,
  onLoad,
  onUndo,
  onRedo,
  onReset,
  onShare,
  canUndo = false,
  canRedo = false,
  isSaving = false,
}: ToolbarProps) {
  const tools = [
    { id: "select" as const, icon: MousePointer, label: "选择", shortcut: "V" },
    { id: "place" as const, icon: Hand, label: "放置", shortcut: "P" },
    { id: "delete" as const, icon: Trash2, label: "删除", shortcut: "D" },
  ]
  const router = useRouter()
  
  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <Card className="w-full">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Tools */}
          <div className="flex items-center gap-1">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={editorState.selectedTool === tool.id ? "default" : "outline"}
                size="sm"
                onClick={() => onToolChange(tool.id)}
                className="flex items-center gap-1"
              >
                <tool.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tool.label}</span>
                <Badge variant="secondary" className="text-xs ml-1 hidden md:inline">
                  {tool.shortcut}
                </Badge>
              </Button>
            ))}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* View Options */}
          <div className="flex items-center gap-1">
            <Button
              variant={editorState.showGrid ? "default" : "outline"}
              size="sm"
              onClick={onToggleGrid}
              className="flex items-center gap-1"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">网格</span>
            </Button>
            <Button
              variant={editorState.showCollisions ? "default" : "outline"}
              size="sm"
              onClick={onToggleCollisions}
              className="flex items-center gap-1"
            >
              {editorState.showCollisions ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="hidden sm:inline">碰撞</span>
            </Button>
           
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* File Operations */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-1 bg-transparent"
            >
              {isSaving ? (
                <>
                  <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
                  <span className="hidden sm:inline">保存中…</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">保存</span>
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={onLoad} className="flex items-center gap-1 bg-transparent">
              <FolderOpen className="h-4 w-4" />
              <span className="hidden sm:inline">加载</span>
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* History */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="flex items-center gap-1 bg-transparent"
            >
              <Undo className="h-4 w-4" />
              <span className="hidden sm:inline">撤销</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRedo}
              disabled={!canRedo}
              className="flex items-center gap-1 bg-transparent"
            >
              <Redo className="h-4 w-4" />
              <span className="hidden sm:inline">重做</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="flex items-center gap-1 bg-transparent text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">重制</span>
            </Button>

             <Button variant="outline" onClick={handleGoHome}>
              返回首页且不保存
            </Button>
          </div>

          {/* Status */}
          {editorState.selectedTemplate && (
            <>
              <Separator orientation="vertical" className="h-6" />
              <Badge variant="default" className="flex items-center gap-1">
                <span>{editorState.selectedTemplate.icon}</span>
                <span>放置: {editorState.selectedTemplate.name}</span>
              </Badge>
            </>
          )}

          {/* Actions on the right */}
          <div className="ml-auto flex items-center gap-1">
            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="flex items-center gap-1 bg-transparent"
              >
                <span className="hidden sm:inline">分享</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/")}
              className="flex items-center gap-1 bg-transparent"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">返回首页</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
