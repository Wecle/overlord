"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, History } from "lucide-react"
import { useCharacterChat } from "@/services/ChatService"
import { useGameStateContext } from "@/contexts/GameStateContext"
import { CharacterModel } from "@/types/mapEditor";
import { getPromptByTemplateId } from "@/utils/formatPrompt"
import { useChatParts } from "./ChatParts"

interface ChatDialogProps {
  isOpen: boolean
  onClose: () => void
  character?: CharacterModel
  npcNearby?: boolean
}

export function ChatDialog({
  isOpen,
  onClose,
  character,
  npcNearby = true,
}: ChatDialogProps) {
  const [showInput, setShowInput] = useState(false) // Added state for inline input toggle
  const [isExpanded, setIsExpanded] = useState(false) // Added state for history expansion
  const inputContainerRef = useRef<HTMLDivElement>(null) // Added ref for click outside detection
  const messagesScrollRef = useRef<HTMLDivElement>(null)

  // 从 character 对象获取属性
  const characterName = character?.characterName
  const characterPrompt = character?.aiPrompt
  const placeholder = character ? `和 ${character.characterName} 聊天吧...` : "说点什么..."
  const characterColor = character?.characterColor || "#10b981"
  const defaultMessages = character?.defaultDialogue

  const { messages, input, isLoading, append, sendMessage, handleSubmit: handleCharacterSubmit } = useCharacterChat({
    characterName,
    characterPrompt: getPromptByTemplateId(character?.templateId || "", characterPrompt || "") || characterPrompt,
    defaultMessages,
  })
  const { enterChatInputState, enterExploringState } = useGameStateContext()
  const { renderPart } = useChatParts({ append })

  // 处理聊天框打开/关闭时的状态切换
  useEffect(() => {
    if (isOpen) {
      enterChatInputState()
    } else {
      enterExploringState()
    }
  }, [isOpen, enterChatInputState, enterExploringState])

  // 如果 NPC 不在附近，自动关闭聊天框
  useEffect(() => {
    if (!npcNearby && isOpen && onClose) {
      onClose()
    }
  }, [npcNearby, isOpen, onClose])

  const scrollToBottom = useCallback(() => {
    const el = messagesScrollRef.current
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    }
  }, [])

  // 消息变化后滚动到底部
  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen, scrollToBottom])

  // 监听自定义事件触发滚动
  useEffect(() => {
    const handler = () => scrollToBottom()
    window.addEventListener("chat:scroll-bottom", handler)
    return () => window.removeEventListener("chat:scroll-bottom", handler)
  }, [scrollToBottom])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        sendMessage(input)
        setShowInput(false) // Hide input after sending
        handleCharacterSubmit(e)
      }
    },
    [input, isLoading, sendMessage, handleCharacterSubmit],
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showInput) {
          setShowInput(false)
          enterExploringState()
        } else if (isOpen) {
          onClose()
          enterExploringState()
        }
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (showInput && inputContainerRef.current && !inputContainerRef.current.contains(e.target as Node)) {
        setShowInput(false)
        enterExploringState()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      if (showInput) {
        document.addEventListener("mousedown", handleClickOutside)
      }
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, onClose, showInput, enterExploringState])

  if (!isOpen || !npcNearby) return null

  const recentMessages = messages.filter((m) => m.role !== "system").slice(-3)
  const latestMessage = recentMessages[recentMessages.length - 1]

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-auto max-w-[1024px]">
          {isExpanded && (
            <div className="bg-black/90 backdrop-blur-sm mx-2 mb-2 p-4 rounded-lg max-h-[50vh] overflow-y-auto">
              <div className="space-y-3">
                {messages
                  .filter((m) => m.role !== "system")
                  .map((message) => (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-blue-500/80 text-white"
                            : "bg-white/10 text-yellow-100 border border-white/20"
                        }`}
                      >
                        {message.role === "assistant" && characterName && (
                          <div
                            className="font-semibold text-xs mb-1"
                            style={{
                              color: characterColor,
                              textShadow: "1px 1px 1px rgba(0,0,0,0.8)",
                            }}
                          >
                            {characterName}
                          </div>
                        )}
                        <div
                          className="whitespace-pre-wrap text-sm font-sans"
                          style={{
                            textShadow: message.role === "assistant" ? "1px 1px 1px rgba(0,0,0,0.8)" : "none",
                          }}
                        >
                          {renderPart(message)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div
            className="relative h-[25vh] bg-black/80 backdrop-blur-sm rounded-t-lg mx-2 mb-2"
            style={{
              backdropFilter: "blur(8px)",
            }}
          >
            {characterName && (
              <div
                className="absolute top-3 left-3 px-3 py-1 rounded text-white font-bold text-sm"
                style={{
                  backgroundColor: characterColor,
                  textShadow:
                    "1px 1px 2px rgba(0,0,0,0.8), -1px -1px 2px rgba(0,0,0,0.8), 1px -1px 2px rgba(0,0,0,0.8), -1px 1px 2px rgba(0,0,0,0.8)",
                }}
              >
                {characterName}
              </div>
            )}

            <div className="absolute top-3 right-3 flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 h-8 w-8"
              >
                <History className="h-4 w-4" />
              </Button>
            </div>

            <div ref={messagesScrollRef} className="absolute top-12 left-3 right-16 bottom-12 py-2 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center gap-2 text-yellow-100">
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-yellow-100"></div>
                  <span
                    className="text-sm font-sans"
                    style={{
                      textShadow: "1px 1px 1px rgba(0,0,0,0.8)",
                    }}
                  >
                    正在思考...
                  </span>
                </div>
              ) : latestMessage ? (
                <div
                  className="whitespace-pre-wrap text-yellow-100 font-sans text-sm leading-relaxed"
                  style={{
                    textShadow: "1px 1px 1px rgba(0,0,0,0.8)",
                  }}
                >
                  {renderPart(latestMessage)}
                </div>
              ) : (
                <div
                  className="text-white/60 font-sans text-sm"
                  style={{
                    textShadow: "1px 1px 1px rgba(0,0,0,0.8)",
                  }}
                >
                  开始对话...
                </div>
              )}
            </div>

            <div className="absolute bottom-3 left-3 right-16" ref={inputContainerRef}>
              {!showInput ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowInput(true)
                    enterChatInputState()
                  }}
                  className="text-white/70 hover:text-white hover:bg-white/10 p-2 h-auto font-sans text-xs"
                >
                  输入你想说的话
                </Button>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => sendMessage(e.target.value)}
                    placeholder={placeholder}
                    className="min-h-[40px] resize-none bg-white/10 border-white/20 text-white placeholder:text-white/50 text-sm"
                    disabled={isLoading}
                    autoFocus
                    onFocus={() => enterChatInputState()}
                    onBlur={() => enterExploringState()}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="bg-green-600 hover:bg-green-700 h-8 w-8 p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
