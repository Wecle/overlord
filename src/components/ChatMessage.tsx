import { cn, splitThinkingTags } from "@/lib/utils"
import { Response } from "@/components/ai-elements/response"
import type { UIMessage } from "ai"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import type { FC } from "react"

interface ChatMessageProps {
  role: "user" | "assistant" | "system"
  message: UIMessage
}

type MessagePart = UIMessage["parts"][number]

interface ReasoningBlockProps {
  content: string
}

const ReasoningBlock: FC<ReasoningBlockProps> = ({ content }) => {
  return (
    <div className="w-full">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="reasoning">
          <AccordionTrigger className="text-xs text-gray-500 text-center dark:text-gray-400 mb-1 flex items-center gap-1 cursor-pointer">
            Reasoning
          </AccordionTrigger>
          <AccordionContent>
            <pre className="whitespace-pre-wrap text-xs font-mono bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 rounded-md px-3 py-2 w-full transition-all duration-200">
              {content}
            </pre>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

interface TextContentProps {
  role: ChatMessageProps["role"]
  content: string
}

const TextContent: FC<TextContentProps> = ({ role, content }) => {
  const baseClasses = `max-w-[80%] rounded-lg p-3 whitespace-pre-wrap text-sm`

  const containerClasses = cn(`flex`, role === "user" ? "justify-end" : "justify-start")

  const contentClasses = cn(
    baseClasses,
    role === "user"
      ? "bg-primary text-primary-foreground ml-auto"
      : role === "assistant"
        ? "bg-muted font-mono"
        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  )

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        <Response className="leading-relaxed">{content}</Response>
      </div>
    </div>
  )
}

const ChatMessage: FC<ChatMessageProps> = ({ role, message }) => {
  if (!["user", "assistant", "system"].includes(role)) return null

  const renderMessagePart = (part: MessagePart, index: number) => {
    if (part.type === "reasoning") {
      return <ReasoningBlock key={index} content={part.reasoning} />
    }

    if (part.type === "text") {
      const segments = splitThinkingTags(part.text)
      return segments.map((seg, i) =>
        seg.type === "reasoning" ? (
          <ReasoningBlock key={`${index}-${i}`} content={seg.content} />
        ) : (
          <TextContent key={`${index}-${i}`} role={role} content={seg.content} />
        ),
      )
    }
    return null
  }

  return <div className="space-y-2">{message.parts.map(renderMessagePart)}</div>
}

export { ChatMessage }
