"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { BuildingModel } from "@/types/mapEditor"

interface BuildingPropertiesProps {
  building: BuildingModel
  onUpdate: (updates: Partial<BuildingModel>) => void
}

export function BuildingProperties({ building, onUpdate }: BuildingPropertiesProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="buildingType">建筑类型</Label>
        <Select value={building.buildingType} onValueChange={(value) => onUpdate({ buildingType: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="house-small">小屋</SelectItem>
            <SelectItem value="shop-general">杂货店</SelectItem>
            <SelectItem value="tower-watch">瞭望塔</SelectItem>
            <SelectItem value="well">水井</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isEnterable"
          checked={building.isEnterable}
          onCheckedChange={(checked) => onUpdate({ isEnterable: checked })}
        />
        <Label htmlFor="isEnterable">可进入</Label>
      </div>

      {building.isEnterable && (
        <div>
          <Label htmlFor="capacity">容量</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            max="50"
            value={building.capacity || 1}
            onChange={(e) => onUpdate({ capacity: Number.parseInt(e.target.value) || 1 })}
          />
          <p className="text-xs text-muted-foreground mt-1">建筑内可容纳的人数或物品数量</p>
        </div>
      )}
    </div>
  )
}
