import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function parseTelegramLinks(telegramLink) {
  if (!telegramLink) return []
  if (Array.isArray(telegramLink)) {
    return telegramLink.map(l => String(l).trim()).filter(Boolean)
  }
  if (typeof telegramLink === "string") {
    return telegramLink
      .split(/[\r\n,]+/)
      .map(l => l.trim())
      .filter(l => l.length > 0)
  }
  return []
}
