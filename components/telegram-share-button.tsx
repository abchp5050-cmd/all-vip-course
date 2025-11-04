"use client"

import { Button } from "@/components/ui/button"
import { Send } from "lucide-react"
import { generateTelegramLink, generateTelegramShareMessage } from "@/lib/telegram"

interface TelegramShareButtonProps {
  courseId: string
  courseTitle: string
  userId: string
  botToken?: string
}

export function TelegramShareButton({
  courseId,
  courseTitle,
  userId,
  botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || "your-bot-token",
}: TelegramShareButtonProps) {
  const handleShare = () => {
    // Generate secure access link
    const accessLink = generateTelegramLink({
      botToken,
      courseId,
      userId,
    })

    // Generate share message
    const shareMessage = generateTelegramShareMessage(courseTitle, `${window.location.origin}${accessLink}`)

    // Open Telegram with pre-filled message
    const encodedMessage = encodeURIComponent(shareMessage)
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
      `${window.location.origin}${accessLink}`,
    )}&text=${encodedMessage}`

    window.open(telegramUrl, "_blank")
  }

  return (
    <Button onClick={handleShare} variant="outline" className="flex items-center gap-2 bg-transparent">
      <Send className="w-4 h-4" />
      Share on Telegram
    </Button>
  )
}
