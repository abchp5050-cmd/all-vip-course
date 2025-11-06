import { useState, useEffect } from "react"
import { Send, Check } from "lucide-react"
import { doc, updateDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { db } from "../lib/firebase"
import { toast } from "sonner"

export default function TelegramJoinButton({ enrollmentId, telegramLink, courseName }) {
  const [hasJoined, setHasJoined] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkJoinStatus()
  }, [enrollmentId])

  const checkJoinStatus = async () => {
    if (!enrollmentId) {
      setLoading(false)
      return
    }

    try {
      const enrollmentDoc = await getDoc(doc(db, "enrollments", enrollmentId))
      if (enrollmentDoc.exists()) {
        const data = enrollmentDoc.data()
        setHasJoined(!!data.telegramJoinedAt)
      }
    } catch (error) {
      console.error("Error checking join status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinTelegram = async () => {
    if (!telegramLink) {
      toast.error("Telegram link not available for this course")
      return
    }

    if (hasJoined) {
      toast.info("You've already joined this Telegram group")
      return
    }

    try {
      let telegramAppUrl
      const link = telegramLink
      
      if (link.includes('joinchat/') || link.includes('+')) {
        let inviteCode = link
        if (inviteCode.includes('joinchat/')) {
          inviteCode = inviteCode.split('joinchat/')[1].split('?')[0]
        } else if (inviteCode.includes('+')) {
          inviteCode = inviteCode.split('+')[1].split('?')[0]
        }
        telegramAppUrl = `tg://join?invite=${inviteCode}`
      } else if (link.includes('t.me/')) {
        const username = link.split('t.me/')[1].split('/')[0].split('?')[0]
        telegramAppUrl = `tg://resolve?domain=${username}`
      } else {
        telegramAppUrl = link
      }
      
      window.location.href = telegramAppUrl
      
      setTimeout(async () => {
        if (enrollmentId) {
          try {
            await updateDoc(doc(db, "enrollments", enrollmentId), {
              telegramJoinedAt: serverTimestamp()
            })
            setHasJoined(true)
            toast.success("Joined Telegram group successfully!")
          } catch (error) {
            console.error("Error updating join status:", error)
          }
        }
      }, 1000)
    } catch (error) {
      console.error("Error joining Telegram group:", error)
      toast.error("Failed to open Telegram")
    }
  }

  if (!telegramLink) {
    return null
  }

  if (loading) {
    return (
      <button
        disabled
        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-muted text-muted-foreground cursor-not-allowed w-full"
      >
        <Send className="w-4 h-4" />
        <span>Loading...</span>
      </button>
    )
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleJoinTelegram}
        disabled={hasJoined}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition w-full ${
          hasJoined
            ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
        }`}
      >
        {hasJoined ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        <span>{hasJoined ? "Joined Telegram Group" : "Join Telegram Group"}</span>
      </button>
      {!hasJoined && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 p-2 rounded border border-yellow-200 dark:border-yellow-800">
          <span className="font-semibold">Warning:</span> এই লিংকে ক্লিক করলে তোমাকে সরাসরি পেইড চ্যনেলে নিয়ে যাবে, সেখানে জয়েন করে নিবে! এই Button এক বার ক্লিক করলে পরে আর কাজ করবে না! তাই ১ম ক্লিকেই প্রাইভেট চ্যানেলে জয়েন হয়ে যাবে।
        </p>
      )}
    </div>
  )
}
