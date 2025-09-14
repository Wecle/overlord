"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TEMPLATES_BY_CATEGORY } from "@/constants/modelTemplates"
import { ModelCategory, type ModelTemplate } from "@/types/mapEditor"

interface ModelPaletteProps {
  selectedTemplate: ModelTemplate | null
  onSelectTemplate: (template: ModelTemplate | null) => void
  onStartDrag: (
    template: ModelTemplate,
    startPosition: { x: number; y: number },
    offset: { x: number; y: number },
  ) => void
}

export function ModelPalette({ selectedTemplate, onSelectTemplate, onStartDrag }: ModelPaletteProps) {
  const [activeCategory, setActiveCategory] = useState<ModelCategory>(ModelCategory.CHARACTER)
  const buttonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({})

  const handleTemplateClick = (template: ModelTemplate) => {
    if (selectedTemplate?.id === template.id) {
      onSelectTemplate(null)
    } else {
      onSelectTemplate(template)
    }
  }

  const handleDragStart = (e: React.DragEvent, template: ModelTemplate) => {
    const button = buttonRefs.current[template.id]
    if (!button) return

    const dragImage = document.createElement("div")
    dragImage.innerHTML = `
      <div style="
        background: transparent;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        white-space: nowrap;
      ">
        <span style="font-size: 18px;">${template.icon}</span>
      </div>
    `
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"
    dragImage.style.left = "-1000px"
    document.body.appendChild(dragImage)

    // Set the custom drag image
    e.dataTransfer.setDragImage(dragImage, 50, 25)

    // Clean up the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)

    const offset = {
      x: 0, // Center horizontally
      y: 0, // Center vertically
    }

    const startPosition = {
      x: e.clientX,
      y: e.clientY,
    }

    // Store template data for drop handling
    e.dataTransfer.setData("application/json", JSON.stringify(template))
    e.dataTransfer.effectAllowed = "copy"

    onStartDrag(template, startPosition, offset)
  }

  const handleDragEnd = () => {
    // Drag operation completed, could add cleanup here if needed
  }

  return (
    <Card className="w-80 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">模型库</CardTitle>
        <p className="text-sm text-muted-foreground">点击选择或拖拽到地图上放置</p>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs className="px-4" value={activeCategory} onValueChange={(value) => setActiveCategory(value as ModelCategory)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value={ModelCategory.CHARACTER} className="text-xs">
              人物
            </TabsTrigger>
            <TabsTrigger value={ModelCategory.PLANT} className="text-xs">
              植物
            </TabsTrigger>
            <TabsTrigger value={ModelCategory.BUILDING} className="text-xs">
              建筑
            </TabsTrigger>
          </TabsList>

          {Object.entries(TEMPLATES_BY_CATEGORY).map(([category, templates]) => (
            <TabsContent key={category} value={category} className="mt-0">
              <ScrollArea className="h-[calc(100vh-200px)]">
                <div className="space-y-2 py-4">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      ref={(el) => {
                        buttonRefs.current[template.id] = el
                      }}
                      variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                      className="w-full justify-start h-auto p-3 flex-col items-start gap-2 cursor-grab active:cursor-grabbing"
                      onClick={() => handleTemplateClick(template)}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, template)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{template.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                        </div>
                      </div>
                      <div className="flex gap-1 w-full">
                        <Badge variant="secondary" className="text-xs">
                          {template.defaultGridSize.gridWidth}x{template.defaultGridSize.gridHeight}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}
