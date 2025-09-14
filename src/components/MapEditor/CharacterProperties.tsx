"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { CharacterModel } from "@/types/mapEditor"
import { CharacterTemplateId } from "@/types/mapEditor"

interface CharacterPropertiesProps {
  character: CharacterModel
  validationErrors: string[]
  onUpdate: (updates: Partial<CharacterModel>) => void
  onAIPromptTemplate: (template: string) => void
  getCurrentAITemplate: () => string | undefined
}

export function CharacterProperties({
  character,
  validationErrors,
  onUpdate,
  onAIPromptTemplate,
  getCurrentAITemplate,
}: CharacterPropertiesProps) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="basic">基础</TabsTrigger>
        <TabsTrigger value="dialogue">对话</TabsTrigger>
      </TabsList>

      <TabsContent value="basic" className="space-y-4 mt-4">
        <div>
          <Label htmlFor="characterName">角色名称</Label>
          <Input
            id="characterName"
            value={character.characterName}
            onChange={(e) => onUpdate({ characterName: e.target.value })}
            placeholder="输入角色名称"
            className={validationErrors.some((e) => e.includes("角色名称")) ? "border-red-500" : ""}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isInteractable"
            checked={character.isInteractable}
            onCheckedChange={(checked) => onUpdate({ isInteractable: checked })}
          />
          <Label htmlFor="isInteractable">可交互</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="canDialogue"
            checked={character.canDialogue}
            onCheckedChange={(checked) => onUpdate({ canDialogue: checked })}
          />
          <Label htmlFor="canDialogue">可以对话</Label>
        </div>
      </TabsContent>

      <TabsContent value="dialogue" className="space-y-4 mt-4">
        {character.canDialogue ? (
          <>
            <div>
              <Label htmlFor="defaultDialogue">默认对话</Label>
              <Textarea
                id="defaultDialogue"
                value={character.defaultDialogue}
                onChange={(e) => onUpdate({ defaultDialogue: e.target.value })}
                placeholder="输入默认对话内容"
                rows={3}
                className={validationErrors.some((e) => e.includes("默认对话")) ? "border-red-500" : ""}
              />
            </div>

            <div>
              <Label htmlFor="aiPromptTemplate">AI 角色模板</Label>
              <Select
                defaultValue={getCurrentAITemplate()}
                onValueChange={onAIPromptTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色模板" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CharacterTemplateId.MERCHANT}>商人</SelectItem>
                  <SelectItem value={CharacterTemplateId.GUARD}>守卫</SelectItem>
                  <SelectItem value={CharacterTemplateId.VILLAGER}>村民</SelectItem>
                  <SelectItem value={CharacterTemplateId.ELDER}>长者</SelectItem>
                  <SelectItem value={CharacterTemplateId.CHILD}>孩子</SelectItem>
                  <SelectItem value={CharacterTemplateId.ARTISAN}>工匠</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="aiPrompt">AI 对话提示词</Label>
              <Textarea
                id="aiPrompt"
                value={character.aiPrompt}
                onChange={(e) => onUpdate({ aiPrompt: e.target.value })}
                placeholder="输入 AI 角色设定和对话风格"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                设定角色的性格、背景和对话风格，AI 将根据这个提示词与玩家对话
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground text-sm">启用对话功能后可配置对话选项</div>
        )}
      </TabsContent>
    </Tabs>
  )
}
