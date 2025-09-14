"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { PlantModel } from "@/types/mapEditor"

interface PlantPropertiesProps {
  plant: PlantModel
  onUpdate: (updates: Partial<PlantModel>) => void
}

export function PlantProperties({ plant, onUpdate }: PlantPropertiesProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="plantType">植物类型</Label>
        <Select value={plant.plantType} onValueChange={(value) => onUpdate({ plantType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tree-oak">橡树</SelectItem>
            <SelectItem value="tree-pine">松树</SelectItem>
            <SelectItem value="bush-berry">浆果丛</SelectItem>
            <SelectItem value="flower-patch">花丛</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="growthStage">生长阶段</Label>
        <div className="flex items-center space-x-2">
          <Input
            id="growthStage"
            type="range"
            min="1"
            max="5"
            value={plant.growthStage}
            onChange={(e) => onUpdate({ growthStage: Number.parseInt(e.target.value) || 1 })}
            className="flex-1"
          />
          <Badge variant="outline">{plant.growthStage}/5</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">1=幼苗, 3=成熟, 5=完全成长</p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isHarvestable"
          checked={plant.isHarvestable}
          onCheckedChange={(checked) => onUpdate({ isHarvestable: checked })}
        />
        <Label htmlFor="isHarvestable">可采摘</Label>
      </div>
    </div>
  )
}
