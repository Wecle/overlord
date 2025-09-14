import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function splitThinkingTags(text: string): { type: "text" | "reasoning"; content: string }[] {
  const result: { type: "text" | "reasoning"; content: string }[] = []
  const thinkingStart = "<Thinking>"
  const thinkingEnd = "</Thinking>"
  let current = 0

  while (current < text.length) {
    const start = text.indexOf(thinkingStart, current)
    const end = text.indexOf(thinkingEnd, start + thinkingStart.length)

    if (start !== -1 && end !== -1) {
      if (start > current) {
        result.push({ type: "text", content: text.slice(current, start) })
      }
      result.push({
        type: "reasoning",
        content: text.slice(start + thinkingStart.length, end),
      })
      current = end + thinkingEnd.length
    } else {
      const cleanText = text.slice(current)?.trim()
      if (cleanText) {
        result.push({ type: "text", content: cleanText })
      }
      break
    }
  }

  return result
}
