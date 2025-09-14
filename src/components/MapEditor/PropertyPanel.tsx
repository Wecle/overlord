"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Trash2, Copy, RotateCcw, Save, MessageSquare, Settings, MapPin } from "lucide-react"
import type { GameModel, CharacterModel, PlantModel, BuildingModel } from "@/types/mapEditor"
import { AI_PROMPT_TEMPLATES } from "@/constants/modelTemplates"
import { CharacterProperties } from "./CharacterProperties"
import { PlantProperties } from "./PlantProperties"
import { BuildingProperties } from "./BuildingProperties"

interface PropertyPanelProps {
  selectedModel: GameModel | null
  onUpdateModel: (id: string, updates: Partial<GameModel>) => void
  onDeleteModel: (id: string) => void
  onDuplicateModel?: (model: GameModel) => void
  onMoveModel?: (id: string, gridX: number, gridY: number) => void
  getCollisionInfo?: (gridPos: { gridX: number; gridY: number }, gridSize: any) => { validPosition: boolean }
}

export function PropertyPanel({
  selectedModel,
  onUpdateModel,
  onDeleteModel,
  onDuplicateModel,
  onMoveModel,
  getCollisionInfo,
}: PropertyPanelProps) {
  const [localModel, setLocalModel] = useState<GameModel | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    setLocalModel(selectedModel)
    setHasUnsavedChanges(false)
    setValidationErrors([])
  }, [selectedModel])

  if (!localModel) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            属性面板
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground text-sm mb-2">未选择模型</div>
            <p className="text-xs text-muted-foreground">点击地图上的模型来编辑其属性</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const validateModel = (model: GameModel): string[] => {
    const errors: string[] = []

    if (!model.name.trim()) {
      errors.push("模型名称不能为空")
    }

    if (model.category === "character") {
      const character = model as CharacterModel
      if (!character.characterName.trim()) {
        errors.push("角色名称不能为空")
      }
      if (character.canDialogue && !character.defaultDialogue.trim()) {
        errors.push("启用对话时必须设置默认对话内容")
      }
    }

    return errors
  }

  const handleUpdate = (updates: Partial<GameModel>) => {
    const updatedModel = { ...localModel, ...updates } as GameModel
    setLocalModel(updatedModel)
    setHasUnsavedChanges(true)

    // Validate the updated model
    const errors = validateModel(updatedModel)
    setValidationErrors(errors)
  }

  const handleSave = () => {
    if (validationErrors.length === 0) {
      onUpdateModel(localModel.id, localModel)
      setHasUnsavedChanges(false)
    }
  }

  const handleReset = () => {
    setLocalModel(selectedModel)
    setHasUnsavedChanges(false)
    setValidationErrors([])
  }

  const handlePositionChange = (gridX: number, gridY: number) => {
    if (onMoveModel && getCollisionInfo) {
      const collisionInfo = getCollisionInfo({ gridX, gridY }, localModel.gridSize)
      if (collisionInfo.validPosition) {
        onMoveModel(localModel.id, gridX, gridY)
      }
    }
  }

  const handleAIPromptTemplate = (template: string) => {
    if (localModel.category === "character") {
      handleUpdate({ aiPrompt: AI_PROMPT_TEMPLATES[template as keyof typeof AI_PROMPT_TEMPLATES] })
    }
  }

  // 获取当前角色对应的AI模板值
  const getCurrentAITemplate = (): string | undefined => {
    if (localModel.category === "character") {
      return localModel.templateId
    }
    return undefined
  }



  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            属性面板
            {hasUnsavedChanges && <Badge variant="destructive">未保存</Badge>}
          </CardTitle>
          <div className="flex gap-1">
            {onDuplicateModel && (
              <Button variant="outline" size="sm" onClick={() => onDuplicateModel(localModel)}>
                <Copy className="h-4 w-4" />
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onDeleteModel(localModel.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              <ul className="text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Properties */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="modelName">模型名称</Label>
            <Input
              id="modelName"
              value={localModel.name}
              onChange={(e) => handleUpdate({ name: e.target.value })}
              placeholder="输入模型名称"
              className={validationErrors.some((e) => e.includes("模型名称")) ? "border-red-500" : ""}
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{localModel.category}</Badge>
            <Badge variant="outline">
              {localModel.gridSize.gridWidth}x{localModel.gridSize.gridHeight}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {localModel.gridPosition.gridX},{localModel.gridPosition.gridY}
            </Badge>
          </div>

          {/* Position Controls */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">网格 X</Label>
              <Input
                type="number"
                value={localModel.gridPosition.gridX}
                onChange={(e) => {
                  const newX = Number.parseInt(e.target.value) || 0
                  handlePositionChange(newX, localModel.gridPosition.gridY)
                }}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">网格 Y</Label>
              <Input
                type="number"
                value={localModel.gridPosition.gridY}
                onChange={(e) => {
                  const newY = Number.parseInt(e.target.value) || 0
                  handlePositionChange(localModel.gridPosition.gridX, newY)
                }}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Category-specific Properties */}
        {localModel.category === "character" && (
          <CharacterProperties
            character={localModel as CharacterModel}
            validationErrors={validationErrors}
            onUpdate={handleUpdate}
            onAIPromptTemplate={handleAIPromptTemplate}
            getCurrentAITemplate={getCurrentAITemplate}
          />
        )}
        {localModel.category === "plant" && (
          <PlantProperties
            plant={localModel as PlantModel}
            onUpdate={handleUpdate}
          />
        )}
        {localModel.category === "building" && (
          <BuildingProperties
            building={localModel as BuildingModel}
            onUpdate={handleUpdate}
          />
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} disabled={validationErrors.length > 0 || !hasUnsavedChanges} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            保存
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={!hasUnsavedChanges}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
        </div>

        {/* Quick Actions */}
        {localModel.category === "character" && (localModel as CharacterModel).canDialogue && (
          <Button
            variant="outline"
            className="w-full bg-transparent"
            onClick={() => {
              /* TODO: Open chat test */
            }}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            测试对话
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
