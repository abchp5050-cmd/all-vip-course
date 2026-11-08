import { db } from '../src/lib/firebase.js';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

let isPolling = false;
let pollingOffset = 0;

/**
 * Handle Approve action triggered from Telegram inline button
 */
async function handleApproveOrder(paymentId, callbackQuery, botToken) {
  const callbackId = callbackQuery.id;
  const message = callbackQuery.message;
  const chatId = message?.chat?.id;
  const messageId = message?.message_id;
  const currentText = message?.text || "";

  try {
    const paymentRef = doc(db, "payments", paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      await answerCallbackQuery(botToken, callbackId, "⚠️ Order not found in database!", true);
      return;
    }

    const payment = paymentSnap.data();

    // If already approved, notify user and ensure message is updated
    if (payment.status === "approved") {
      await answerCallbackQuery(botToken, callbackId, "Order is already approved!", false);
      const cleanText = currentText
        .replace(/\n\n🟢 Status:.*$/s, "")
        .replace(/\n\n🔴 Status:.*$/s, "");
      await editMessageText(botToken, chatId, messageId, `${cleanText}\n\n🟢 Status: APPROVED ✅`);
      return;
    }

    // 1. Update Payment Record to approved
    const updatedCourses = (payment.courses || []).map((c) => ({
      ...c,
      status: "approved",
      rejectionReason: null,
      approvedAt: new Date().toISOString(),
    }));

    await updateDoc(paymentRef, {
      status: "approved",
      approvedAt: serverTimestamp(),
      rejectionReason: null,
      courses: updatedCourses,
    });

    // 2. Grant access in userCourses & update enrollments
    for (const course of payment.courses || []) {
      try {
        await setDoc(doc(db, "userCourses", `${payment.userId}_${course.id}`), {
          userId: payment.userId,
          courseId: course.id,
          enrolledAt: serverTimestamp(),
          progress: 0,
        });
      } catch (err) {
        console.error(`[TelegramBot] Error setting userCourse for ${course.id}:`, err);
      }

      try {
        const eq = query(
          collection(db, "enrollments"),
          where("userId", "==", payment.userId),
          where("courseId", "==", course.id)
        );
        const snap = await getDocs(eq);
        for (const d of snap.docs) {
          await updateDoc(doc(db, "enrollments", d.id), {
            status: "APPROVED",
            rejectionReason: null,
            approvedAt: serverTimestamp(),
          });
        }
      } catch (err) {
        console.error(`[TelegramBot] Error updating enrollments for ${course.id}:`, err);
      }
    }

    // 3. Edit Telegram message to show APPROVED status and remove buttons
    const cleanText = currentText
      .replace(/\n\n🟢 Status:.*$/s, "")
      .replace(/\n\n🔴 Status:.*$/s, "");
    await editMessageText(botToken, chatId, messageId, `${cleanText}\n\n🟢 Status: APPROVED ✅`);

    // 4. Send popup notification to Telegram user
    await answerCallbackQuery(botToken, callbackId, "Order Approved & Course Unlocked!", true);
    console.log(`[TelegramBot] Payment ${paymentId} APPROVED successfully via Telegram button.`);
  } catch (error) {
    console.error(`[TelegramBot] Error approving payment ${paymentId}:`, error);
    await answerCallbackQuery(botToken, callbackId, `Error approving order: ${error.message}`, true);
  }
}

/**
 * Handle Reject action triggered from Telegram inline button
 */
async function handleRejectOrder(paymentId, callbackQuery, botToken) {
  const callbackId = callbackQuery.id;
  const message = callbackQuery.message;
  const chatId = message?.chat?.id;
  const messageId = message?.message_id;
  const currentText = message?.text || "";

  try {
    const paymentRef = doc(db, "payments", paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      await answerCallbackQuery(botToken, callbackId, "⚠️ Order not found in database!", true);
      return;
    }

    const payment = paymentSnap.data();

    // 1. Update Payment Record to rejected
    const updatedCourses = (payment.courses || []).map((c) => ({
      ...c,
      status: "rejected",
      rejectionReason: "Order rejected by admin via Telegram",
    }));

    await updateDoc(paymentRef, {
      status: "rejected",
      rejectedAt: serverTimestamp(),
      rejectionReason: "Order rejected by admin via Telegram",
      courses: updatedCourses,
    });

    // 2. Update matching enrollments
    for (const course of payment.courses || []) {
      try {
        const eq = query(
          collection(db, "enrollments"),
          where("userId", "==", payment.userId),
          where("courseId", "==", course.id)
        );
        const snap = await getDocs(eq);
        for (const d of snap.docs) {
          if (d.data().status !== "APPROVED") {
            await updateDoc(doc(db, "enrollments", d.id), {
              status: "REJECTED",
              rejectionReason: "Order rejected by admin via Telegram",
              rejectedAt: serverTimestamp(),
            });
          }
        }
      } catch (err) {
        console.error(`[TelegramBot] Error updating enrollments on reject for ${course.id}:`, err);
      }
    }

    // 3. Edit Telegram message to show REJECTED status and remove buttons
    const cleanText = currentText
      .replace(/\n\n🟢 Status:.*$/s, "")
      .replace(/\n\n🔴 Status:.*$/s, "");
    await editMessageText(botToken, chatId, messageId, `${cleanText}\n\n🔴 Status: REJECTED ❌`);

    // 4. Send popup notification to Telegram user
    await answerCallbackQuery(botToken, callbackId, "Order Rejected!", true);
    console.log(`[TelegramBot] Payment ${paymentId} REJECTED successfully via Telegram button.`);
  } catch (error) {
    console.error(`[TelegramBot] Error rejecting payment ${paymentId}:`, error);
    await answerCallbackQuery(botToken, callbackId, `Error rejecting order: ${error.message}`, true);
  }
}

/**
 * Helper to answer callback query with a popup alert
 */
async function answerCallbackQuery(botToken, callbackQueryId, text, showAlert = true) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
  } catch (err) {
    console.error("[TelegramBot] Failed to answerCallbackQuery:", err.message);
  }
}

/**
 * Helper to edit message text and remove inline buttons
 */
async function editMessageText(botToken, chatId, messageId, newText) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: newText,
        reply_markup: { inline_keyboard: [] },
      }),
    });
  } catch (err) {
    console.error("[TelegramBot] Failed to editMessageText:", err.message);
  }
}

/**
 * Start Telegram Polling Loop in background
 */
export async function startTelegramPolling() {
  if (isPolling) {
    return;
  }

  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!botToken) {
    console.warn("[TelegramBot] TELEGRAM_BOT_TOKEN not configured. Polling not started.");
    return;
  }

  isPolling = true;
  console.log("[TelegramBot] Starting background Telegram polling for order approval buttons...");

  // Delete any existing webhook to prevent 409 Conflict with getUpdates
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=false`);
  } catch (e) {
    console.warn("[TelegramBot] deleteWebhook note:", e.message);
  }

  // Polling loop
  (async function pollLoop() {
    while (isPolling) {
      try {
        const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${pollingOffset}&timeout=20&allowed_updates=["callback_query"]`;
        const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
        const data = await res.json().catch(() => ({}));

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            pollingOffset = Math.max(pollingOffset, update.update_id + 1);

            if (update.callback_query) {
              const callbackQuery = update.callback_query;
              const callbackData = (callbackQuery.data || "").trim();

              if (callbackData.startsWith("approve_")) {
                const paymentId = callbackData.replace("approve_", "").trim();
                await handleApproveOrder(paymentId, callbackQuery, botToken);
              } else if (callbackData.startsWith("reject_")) {
                const paymentId = callbackData.replace("reject_", "").trim();
                await handleRejectOrder(paymentId, callbackQuery, botToken);
              }
            }
          }
        } else if (!data.ok) {
          // If conflict or rate limited, back off slightly
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (pollErr) {
        // Network blip or timeout; back off and retry cleanly
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  })();
}
