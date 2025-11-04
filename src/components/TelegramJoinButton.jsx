import { useState } from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

export default function TelegramJoinButton({ userId, courseId, enrollmentId, courseName }) {
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);

  const handleJoinTelegram = async () => {
    if (joined) {
      toast.info("You've already joined this Telegram group");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/get-telegram-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          courseId,
          enrollmentId
        })
      });

      const data = await response.json();

      if (data.success) {
        setJoined(true);
        
        // Open Telegram app directly using tg:// protocol
        window.location.href = data.telegramLink;
        
        toast.success("Opening Telegram app...");
      } else {
        toast.error(data.error || "Failed to get Telegram link");
      }
    } catch (error) {
      console.error("Error joining Telegram group:", error);
      toast.error("Failed to join Telegram group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleJoinTelegram}
      disabled={loading || joined}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition w-full ${
        joined
          ? "bg-green-100 text-green-800 border-2 border-green-300 cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
      }`}
    >
      <Send size={20} />
      <span>
        {loading ? "Loading..." : joined ? "✓ Joined Telegram Group" : "Join Telegram Group"}
      </span>
    </button>
  );
}
