import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function parseTelegramLinks(telegramLink) {
  if (!telegramLink) return []

  // If passed an entire course or object containing links
  if (typeof telegramLink === "object" && !Array.isArray(telegramLink)) {
    if (telegramLink.telegramLinks) {
      telegramLink = telegramLink.telegramLinks
    } else if (telegramLink.telegramLink) {
      telegramLink = telegramLink.telegramLink
    } else if (telegramLink.telegramGroupLink) {
      telegramLink = telegramLink.telegramGroupLink
    } else if (telegramLink.url) {
      return [{
        label: String(telegramLink.label || "").trim(),
        url: String(telegramLink.url).trim()
      }]
    } else {
      return []
    }
  }

  if (Array.isArray(telegramLink)) {
    return telegramLink
      .map((item) => {
        if (!item) return null
        if (typeof item === "string") {
          const trimmed = item.trim()
          return trimmed ? { label: "", url: trimmed } : null
        }
        if (typeof item === "object") {
          const url = String(item.url || "").trim()
          const label = String(item.label || "").trim()
          return url ? { label, url } : null
        }
        return null
      })
      .filter(Boolean)
  }

  if (typeof telegramLink === "string") {
    return telegramLink
      .split(/[\r\n,]+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)
      .map((url) => ({ label: "", url }))
  }

  return []
}
