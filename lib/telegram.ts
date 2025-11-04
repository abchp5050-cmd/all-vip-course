/**
 * Telegram Integration for EduAI
 * Provides secure link generation and verification
 */

import crypto from "crypto"

interface TelegramLinkConfig {
  botToken: string
  courseId: string
  userId: string
  expiresIn?: number // seconds, default 24 hours
}

interface VerifyLinkParams {
  courseId: string
  userId: string
  signature: string
  timestamp: string
  botToken: string
}

export function generateTelegramLink(config: TelegramLinkConfig): string {
  const { botToken, courseId, userId, expiresIn = 86400 } = config
  const timestamp = Math.floor(Date.now() / 1000)
  const expiresAt = timestamp + expiresIn

  // Create signature for security verification
  const dataToSign = `${courseId}:${userId}:${expiresAt}`
  const signature = crypto.createHmac("sha256", botToken).update(dataToSign).digest("hex")

  // Encode params for URL
  const params = new URLSearchParams({
    courseId,
    userId,
    expiresAt: String(expiresAt),
    signature,
  })

  return `/api/telegram/access?${params.toString()}`
}

export function verifyTelegramLink(params: VerifyLinkParams): boolean {
  const { courseId, userId, signature, timestamp, botToken } = params
  const currentTime = Math.floor(Date.now() / 1000)

  // Check expiration
  const expiresAt = Number.parseInt(timestamp)
  if (currentTime > expiresAt) {
    return false
  }

  // Verify signature
  const dataToSign = `${courseId}:${userId}:${timestamp}`
  const expectedSignature = crypto.createHmac("sha256", botToken).update(dataToSign).digest("hex")

  return signature === expectedSignature
}

export function generateTelegramShareMessage(courseTitle: string, courseLink: string): string {
  return `📚 Check out this amazing course: *${courseTitle}*\n\n🔗 Access it here: ${courseLink}\n\n✨ Learn with EduAI!`
}
