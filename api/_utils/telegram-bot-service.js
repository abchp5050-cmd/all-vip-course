import { db } from '../../src/lib/firebase.js';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp, 
  collection, 
  query, 
  where, 
  getDocs,
  limit
} from 'firebase/firestore';

let isPolling = false;
let pollingOffset = 0;

/**
 * Check if the given chat/user is the authorized Admin
 */
export function isTelegramAdmin(chatId, fromId) {
  const configuredChatId = (process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "").trim();
  if (!configuredChatId) {
    // If not configured, allow by default
    return true;
  }
  return String(chatId) === String(configuredChatId) || String(fromId) === String(configuredChatId);
}

/**
 * Universal Telegram API caller
 */
export async function telegramApi(token, method, body) {
  const botToken = token || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!botToken) {
    console.warn("[TelegramBot] TELEGRAM_BOT_TOKEN is missing.");
    return { ok: false, error: "TELEGRAM_BOT_TOKEN missing" };
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json().catch(() => ({ ok: false }));
  } catch (err) {
    console.error(`[TelegramBot] Failed ${method}:`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Send a Telegram message
 */
export async function sendMessage(botToken, chatId, text, options = {}) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  return await telegramApi(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: options.parse_mode || "HTML",
    disable_web_page_preview: true,
    reply_markup: options.reply_markup,
  });
}

/**
 * Edit a Telegram message text
 */
export async function editMessageText(botToken, chatId, messageId, text, options = {}) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  return await telegramApi(token, "editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: options.parse_mode || "HTML",
    disable_web_page_preview: true,
    reply_markup: options.reply_markup || { inline_keyboard: [] },
  });
}

/**
 * Answer a callback query (popup toast / notification)
 */
export async function answerCallbackQuery(botToken, callbackQueryId, text, showAlert = false) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  return await telegramApi(token, "answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text || "",
    show_alert: showAlert,
  });
}

/**
 * Register Bot Commands Menu in Telegram (/menu, /stats, /pending, etc.)
 */
export async function registerBotCommands(botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) return { success: false, error: "Missing bot token" };

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setMyCommands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "menu", description: "Admin Control Center & Main Menu" },
          { command: "stats", description: "Live Revenue & Analytics Report" },
          { command: "pending", description: "Review & Approve Pending Orders" },
          { command: "courses", description: "Manage Courses, Status & Prices" },
          { command: "coupons", description: "Manage Promo Codes & Discounts" },
          { command: "addpromo", description: "Create Code: /addpromo <CODE> <AMOUNT>" },
          { command: "user", description: "Search User: /user <email|phone|name>" },
          { command: "announce", description: "Post Notice: /announce <text>" },
          { command: "setbkash", description: "Update bKash No: /setbkash <number>" },
          { command: "setnagad", description: "Update Nagad No: /setnagad <number>" },
          { command: "setprice", description: "Update Price: /setprice <courseId> <price>" },
        ],
      }),
    });
    const data = await res.json().catch(() => ({}));
    return { success: data.ok, details: data };
  } catch (e) {
    console.error("[TelegramBot] Failed to setMyCommands:", e.message);
    return { success: false, error: e.message };
  }
}

/**
 * Register Webhook for Vercel Production
 */
export async function registerTelegramWebhook(customUrl = null) {
  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!botToken) {
    return { success: false, error: "TELEGRAM_BOT_TOKEN missing" };
  }

  const webhookUrl = customUrl || "https://all-vip-course.vercel.app/api/telegram-webhook";
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: false,
      }),
    });
    const data = await res.json().catch(() => ({}));
    
    // Also register commands whenever webhook is set
    await registerBotCommands(botToken);
    
    return { success: data.ok, details: data, webhookUrl };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Safe helper to convert any Firestore timestamp/date into milliseconds
 */
function getTimestampMs(ts) {
  if (!ts) return 0;
  if (typeof ts.toMillis === "function") return ts.toMillis();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  if (typeof ts === "string" || typeof ts === "number") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  }
  return 0;
}

/**
 * Format timestamp nicely in Bangladesh Time
 */
function formatDhakaDate(ts) {
  const ms = getTimestampMs(ts);
  if (!ms) return "N/A";
  return new Date(ms).toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Start of today in Dhaka (UTC+6) in milliseconds
 */
function getTodayStartMs() {
  const now = new Date();
  const dhakaOffsetMs = 6 * 60 * 60 * 1000;
  const dhakaNow = new Date(now.getTime() + dhakaOffsetMs);
  dhakaNow.setUTCHours(0, 0, 0, 0);
  return dhakaNow.getTime() - dhakaOffsetMs;
}

// ==========================================
// 1. INTERACTIVE MAIN ADMIN DASHBOARD
// ==========================================

export async function sendAdminDashboard(chatId, botToken, messageId = null) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const dhakaTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const text = 
`👑 <b>VIP ADMIN CONTROL CENTER</b>
━━━━━━━━━━━━━━━━━━━━
Welcome back, Admin! Select an action below or send a command to manage the platform live from Telegram:

⚡ <b>System Snapshot:</b>
• Server Status: 🟢 <b>Online & Ready</b>
• Local Time: <b>${dhakaTime} BST</b>
• Active Gateways: <b>bKash / Nagad Manual</b>

<i>Tap any button below to open control modules:</i>`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📊 Live Analytics & Revenue", callback_data: "cmd_stats" },
        { text: "⏳ Pending Orders", callback_data: "cmd_pending" },
      ],
      [
        { text: "📚 Manage Courses", callback_data: "cmd_courses" },
        { text: "👤 Search / Manage User", callback_data: "cmd_users_help" },
      ],
      [
        { text: "📢 Post Announcement", callback_data: "cmd_announce_help" },
        { text: "💳 Payment Numbers / Settings", callback_data: "cmd_settings" },
      ],
      [
        { text: "🎟 Manage Promo Codes", callback_data: "cmd_coupons" },
        { text: "🔄 Refresh Dashboard", callback_data: "cmd_menu" },
      ],
    ],
  };

  if (messageId) {
    return await editMessageText(token, chatId, messageId, text, { reply_markup: keyboard });
  } else {
    return await sendMessage(token, chatId, text, { reply_markup: keyboard });
  }
}

// ==========================================
// 2. LIVE ANALYTICS & SALES REPORT
// ==========================================

/**
 * Safely parse numeric revenue/amount from a payment document
 * Checks docData.finalAmount, totalAmount, amount, price, coursePrice, total, subtotal,
 * strips currency symbols/commas, and optionally falls back to course price lookup.
 */
export function parseRevenueAmount(docData, coursePriceLookup = null) {
  if (!docData || typeof docData !== "object") return 0;

  // Explicit free enrollments with no payment amount
  if (docData.isFreeEnrollment === true && !docData.finalAmount && !docData.amount && !docData.totalAmount) {
    return 0;
  }

  // Priority order of candidate price fields
  const candidates = [
    docData.finalAmount,
    docData.totalAmount,
    docData.amount,
    docData.price,
    docData.coursePrice,
    docData.total,
    docData.subtotal,
  ];

  for (const raw of candidates) {
    if (raw !== undefined && raw !== null && raw !== "") {
      const cleanStr = String(raw).replace(/[^0-9.-]+/g, "");
      const num = parseFloat(cleanStr);
      if (!isNaN(num) && num > 0) {
        return num;
      }
    }
  }

  // Check nested courses array if present
  if (Array.isArray(docData.courses) && docData.courses.length > 0) {
    let coursesTotal = 0;
    for (const c of docData.courses) {
      if (c && typeof c === "object") {
        const cPrice = c.price ?? c.coursePrice ?? c.amount;
        if (cPrice !== undefined && cPrice !== null && cPrice !== "") {
          const clean = String(cPrice).replace(/[^0-9.-]+/g, "");
          const parsed = parseFloat(clean);
          if (!isNaN(parsed) && parsed > 0) {
            coursesTotal += parsed;
          }
        } else if (coursePriceLookup && c.id && coursePriceLookup[c.id]) {
          const fallback = parseFloat(coursePriceLookup[c.id]) || 0;
          if (fallback > 0) coursesTotal += fallback;
        }
      }
    }
    if (coursesTotal > 0) {
      return coursesTotal;
    }
  }

  // Fallback: check docData.courseId with coursePriceLookup
  if (coursePriceLookup && (docData.courseId || docData.course?.id)) {
    const cid = docData.courseId || docData.course?.id;
    if (coursePriceLookup[cid] && docData.isFreeEnrollment !== true) {
      const fallback = parseFloat(coursePriceLookup[cid]) || 0;
      if (fallback > 0) return fallback;
    }
  }

  // Check if any candidate was explicitly 0
  for (const raw of candidates) {
    if (raw !== undefined && raw !== null && raw !== "") {
      const cleanStr = String(raw).replace(/[^0-9.-]+/g, "");
      const num = parseFloat(cleanStr);
      if (!isNaN(num)) {
        return num;
      }
    }
  }

  return 0;
}

export async function handleStatsCommand(chatId, botToken, messageId = null) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  try {
    const todayStartMs = getTodayStartMs();

    // Query Firestore collections in parallel
    const [paymentsSnap, usersSnap, coursesSnap] = await Promise.all([
      getDocs(collection(db, "payments")),
      getDocs(collection(db, "users")),
      getDocs(collection(db, "courses")),
    ]);

    // Build course price lookup map from coursesSnap
    const coursePriceMap = {};
    coursesSnap.docs.forEach((d) => {
      const c = d.data();
      if (c && c.price !== undefined) {
        const clean = String(c.price).replace(/[^0-9.-]+/g, "");
        const p = parseFloat(clean);
        if (!isNaN(p)) {
          coursePriceMap[d.id] = p;
        }
      }
    });

    let totalRevenue = 0;
    let todayRevenue = 0;
    let totalApprovedCount = 0;
    let todayApprovedCount = 0;
    let totalPendingCount = 0;
    let todayPendingCount = 0;
    const courseSalesMap = {};

    paymentsSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const amount = parseRevenueAmount(data, coursePriceMap);
      const submittedMs = getTimestampMs(data.submittedAt || data.createdAt);
      const isToday = submittedMs >= todayStartMs;

      if (data.status === "approved") {
        totalRevenue += amount;
        totalApprovedCount += 1;

        if (isToday) {
          todayRevenue += amount;
          todayApprovedCount += 1;
        }

        // Aggregate course sales counts
        if (Array.isArray(data.courses)) {
          data.courses.forEach((c) => {
            const title = c.title || c.name || "Course";
            courseSalesMap[title] = (courseSalesMap[title] || 0) + 1;
          });
        }
      } else if (data.status === "pending") {
        totalPendingCount += 1;
        if (isToday) {
          todayPendingCount += 1;
        }
      }
    });

    const totalUsers = usersSnap.size;
    const totalCourses = coursesSnap.size;
    let activeCourses = 0;
    coursesSnap.docs.forEach((d) => {
      const c = d.data();
      if (c.status === "running" || !c.status) activeCourses += 1;
    });

    // Sort top 3 courses
    const sortedCourses = Object.entries(courseSalesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    let topCoursesText = "<i>No approved sales recorded yet.</i>";
    if (sortedCourses.length > 0) {
      topCoursesText = sortedCourses
        .map(([title, count], idx) => {
          const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉";
          return `${medal} <b>${title}</b> — <b>${count}</b> sales`;
        })
        .join("\n");
    }

    const todayDateStr = new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Dhaka",
      month: "short",
      day: "numeric",
    });

    const text = 
`📊 <b>VIP PLATFORM LIVE ANALYTICS</b>
━━━━━━━━━━━━━━━━━━━━
📅 <b>Today's Sales (${todayDateStr}):</b>
• Today's Revenue: <b>৳${todayRevenue.toLocaleString()}</b>
• Today's Approved: <b>${todayApprovedCount}</b> orders ✅
• Today's Pending: <b>${todayPendingCount}</b> orders ⏳

💎 <b>Lifetime Revenue & Orders:</b>
• Total Lifetime Revenue: <b>৳${totalRevenue.toLocaleString()}</b>
• Total Approved Orders: <b>${totalApprovedCount}</b>
• Pending Queue: <b>${totalPendingCount}</b> orders

👥 <b>Platform Community:</b>
• Registered Students: <b>${totalUsers}</b>
• Total Courses: <b>${totalCourses}</b> (${activeCourses} Running)

🏆 <b>Top 3 Best-Selling Courses:</b>
${topCoursesText}
━━━━━━━━━━━━━━━━━━━━
<i>Updated: ${new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Dhaka" })} BST</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🔄 Refresh Stats", callback_data: "cmd_stats" },
          { text: "⏳ View Pending", callback_data: "cmd_pending" },
        ],
        [
          { text: "🔙 Back to Main Menu", callback_data: "cmd_menu" },
        ],
      ],
    };

    if (messageId) {
      return await editMessageText(token, chatId, messageId, text, { reply_markup: keyboard });
    } else {
      return await sendMessage(token, chatId, text, { reply_markup: keyboard });
    }
  } catch (error) {
    console.error("[TelegramBot] Error generating stats:", error);
    return await sendMessage(token, chatId, `⚠️ Error loading analytics: ${error.message}`);
  }
}

// ==========================================
// 3. PENDING ORDERS QUEUE
// ==========================================

export async function handlePendingOrders(chatId, botToken, messageId = null) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  try {
    const q = query(
      collection(db, "payments"),
      where("status", "==", "pending")
    );
    const snap = await getDocs(q);

    const pendingOrders = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }));

    // Sort newest first
    pendingOrders.sort((a, b) => getTimestampMs(b.submittedAt) - getTimestampMs(a.submittedAt));

    if (pendingOrders.length === 0) {
      const text = 
`✅ <b>All Caught Up!</b>
━━━━━━━━━━━━━━━━━━━━
There are currently <b>zero (0)</b> pending orders awaiting approval.

All student submissions have been processed! 🎉`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "🔄 Refresh Queue", callback_data: "cmd_pending" },
            { text: "🔙 Main Menu", callback_data: "cmd_menu" },
          ],
        ],
      };

      if (messageId) {
        return await editMessageText(token, chatId, messageId, text, { reply_markup: keyboard });
      } else {
        return await sendMessage(token, chatId, text, { reply_markup: keyboard });
      }
    }

    // Up to latest 10 pending orders
    const ordersToShow = pendingOrders.slice(0, 10);

    const headerText = 
`⏳ <b>PENDING ORDERS QUEUE (${pendingOrders.length} Pending)</b>
━━━━━━━━━━━━━━━━━━━━
Showing the latest ${ordersToShow.length} orders. Tap <b>Approve</b> or <b>Reject</b> on any card to take instant action:`;

    if (messageId) {
      await editMessageText(token, chatId, messageId, headerText, {
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔄 Refresh List", callback_data: "cmd_pending" }, { text: "🔙 Main Menu", callback_data: "cmd_menu" }]
          ]
        }
      });
    } else {
      await sendMessage(token, chatId, headerText);
    }

    // Send each pending order card
    for (const payment of ordersToShow) {
      const courseNames = (payment.courses || []).map((c) => c.title || c.name || "Course").join(", ") || "None";
      const submittedDate = formatDhakaDate(payment.submittedAt || payment.createdAt);

      const orderCardText = 
`📋 <b>Pending Order #${payment.id.slice(-6).toUpperCase()}</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>Student:</b> ${payment.customerName || "N/A"}
📱 <b>Phone:</b> <code>${payment.phoneNumber || "N/A"}</code>
💳 <b>Method:</b> ${payment.paymentMethod || "bKash"}
💰 <b>Amount:</b> <b>৳${parseRevenueAmount(payment).toLocaleString()}</b>
🏷 <b>TrxID:</b> <code>${payment.trxId || payment.transactionId || "N/A"}</code>
✈️ <b>Telegram:</b> ${payment.telegramName || payment.telegramId || "N/A"}
📚 <b>Courses:</b> ${courseNames}
⏰ <b>Date:</b> ${submittedDate}`;

      const buttons = {
        inline_keyboard: [
          [
            { text: "✅ Approve Order", callback_data: `approve_${payment.id}` },
            { text: "❌ Reject Order", callback_data: `reject_${payment.id}` },
          ],
        ],
      };

      await sendMessage(token, chatId, orderCardText, { reply_markup: buttons });
    }
  } catch (error) {
    console.error("[TelegramBot] Error fetching pending orders:", error);
    return await sendMessage(token, chatId, `⚠️ Error loading pending queue: ${error.message}`);
  }
}

// ==========================================
// 4. QUICK COURSE CONTROL
// ==========================================

export async function handleCoursesList(chatId, botToken, messageId = null) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  try {
    const snap = await getDocs(collection(db, "courses"));
    const courses = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

    // Sort newest first
    courses.sort((a, b) => getTimestampMs(b.createdAt) - getTimestampMs(a.createdAt));

    if (courses.length === 0) {
      const text = `📚 <b>No courses found in database!</b>`;
      return await sendMessage(token, chatId, text, {
        reply_markup: { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "cmd_menu" }]] },
      });
    }

    const text = 
`📚 <b>VIP COURSE MANAGEMENT (${courses.length} Courses)</b>
━━━━━━━━━━━━━━━━━━━━
Select any course below to inspect details, toggle status (Running/Paused), change price, or delete:`;

    // Build buttons for courses (1 per row for readability)
    const courseButtons = courses.slice(0, 15).map((c) => {
      const statusIcon = c.status === "running" || !c.status ? "🟢" : "🔴";
      const priceText = c.price > 0 ? `৳${c.price}` : "Free";
      const shortTitle = c.title.length > 25 ? `${c.title.slice(0, 24)}…` : c.title;
      return [{ text: `${statusIcon} ${shortTitle} (${priceText})`, callback_data: `course_view_${c.id}` }];
    });

    courseButtons.push([
      { text: "🔄 Refresh Courses", callback_data: "cmd_courses" },
      { text: "🔙 Main Menu", callback_data: "cmd_menu" },
    ]);

    if (messageId) {
      return await editMessageText(token, chatId, messageId, text, { reply_markup: { inline_keyboard: courseButtons } });
    } else {
      return await sendMessage(token, chatId, text, { reply_markup: { inline_keyboard: courseButtons } });
    }
  } catch (error) {
    console.error("[TelegramBot] Error fetching courses:", error);
    return await sendMessage(token, chatId, `⚠️ Error loading courses: ${error.message}`);
  }
}

export async function handleCourseView(courseId, chatId, botToken, messageId = null) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  try {
    const courseRef = doc(db, "courses", courseId);
    const courseSnap = await getDoc(courseRef);

    if (!courseSnap.exists()) {
      return await sendMessage(token, chatId, `⚠️ Course not found.`);
    }

    const course = courseSnap.data();

    // Query enrollments count for this course
    const enrollmentsSnap = await getDocs(
      query(collection(db, "enrollments"), where("courseId", "==", courseId), where("status", "==", "APPROVED"))
    );
    const enrolledCount = enrollmentsSnap.size;

    const categoriesList = Array.isArray(course.categories) && course.categories.length > 0
      ? course.categories.join(", ")
      : course.category || "General";

    const isRunning = course.status === "running" || !course.status;
    const statusText = isRunning ? "🟢 Running (Active)" : "🔴 Paused / Inactive";

    // Telegram links configured
    const tgLinks = Array.isArray(course.telegramLinks) && course.telegramLinks.length > 0
      ? `${course.telegramLinks.length} links configured`
      : (course.telegramLink ? "1 link configured" : "None");

    const text = 
`📖 <b>Course Overview</b>
━━━━━━━━━━━━━━━━━━━━
📌 <b>Title:</b> <b>${course.title}</b>
💰 <b>Price:</b> <b>৳${course.price || 0}</b>
⚡ <b>Status:</b> ${statusText}
📁 <b>Categories:</b> ${categoriesList}
👥 <b>Enrolled Students:</b> <b>${enrolledCount}</b>
✈️ <b>Telegram Links:</b> ${tgLinks}
🆔 <b>Course ID:</b> <code>${courseId}</code>

<i>Choose an action below to manage this course:</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          {
            text: isRunning ? "🔴 Pause Course" : "🟢 Set Running",
            callback_data: `course_toggle_${courseId}`,
          },
          {
            text: "💰 Edit Price",
            callback_data: `course_price_menu_${courseId}`,
          },
        ],
        [
          {
            text: "🗑 Delete Course",
            callback_data: `course_del_ask_${courseId}`,
          },
        ],
        [
          { text: "🔙 Back to Courses", callback_data: "cmd_courses" },
          { text: "🏠 Main Menu", callback_data: "cmd_menu" },
        ],
      ],
    };

    if (messageId) {
      return await editMessageText(token, chatId, messageId, text, { reply_markup: keyboard });
    } else {
      return await sendMessage(token, chatId, text, { reply_markup: keyboard });
    }
  } catch (error) {
    console.error("[TelegramBot] Error in handleCourseView:", error);
    return await sendMessage(token, chatId, `⚠️ Error viewing course: ${error.message}`);
  }
}

export async function handleCourseToggle(courseId, callbackQuery, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;

  try {
    const courseRef = doc(db, "courses", courseId);
    const snap = await getDoc(courseRef);
    if (!snap.exists()) {
      await answerCallbackQuery(token, callbackQuery.id, "Course not found", true);
      return;
    }

    const currentStatus = snap.data().status;
    const newStatus = currentStatus === "running" || !currentStatus ? "paused" : "running";

    await updateDoc(courseRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    await answerCallbackQuery(token, callbackQuery.id, `Status updated to ${newStatus.toUpperCase()}!`, false);
    await handleCourseView(courseId, chatId, token, messageId);
  } catch (error) {
    console.error("[TelegramBot] Error toggling course:", error);
    await answerCallbackQuery(token, callbackQuery.id, `Error: ${error.message}`, true);
  }
}

export async function handleCoursePriceMenu(courseId, chatId, botToken, messageId = null) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  try {
    const snap = await getDoc(doc(db, "courses", courseId));
    if (!snap.exists()) return;
    const course = snap.data();

    const text = 
`💰 <b>Quick Price Edit</b>
━━━━━━━━━━━━━━━━━━━━
Course: <b>${course.title}</b>
Current Price: <b>৳${course.price || 0}</b>

Tap a quick preset button below or send a custom command:
<code>/setprice ${courseId} &lt;amount&gt;</code>

<i>Example:</i> <code>/setprice ${courseId} 450</code>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "৳0 (Free)", callback_data: `course_setprice_${courseId}_0` },
          { text: "৳150", callback_data: `course_setprice_${courseId}_150` },
          { text: "৳250", callback_data: `course_setprice_${courseId}_250` },
        ],
        [
          { text: "৳500", callback_data: `course_setprice_${courseId}_500` },
          { text: "৳1000", callback_data: `course_setprice_${courseId}_1000` },
          { text: "৳1500", callback_data: `course_setprice_${courseId}_1500` },
        ],
        [
          { text: "🔙 Back to Course", callback_data: `course_view_${courseId}` },
        ],
      ],
    };

    if (messageId) {
      return await editMessageText(token, chatId, messageId, text, { reply_markup: keyboard });
    } else {
      return await sendMessage(token, chatId, text, { reply_markup: keyboard });
    }
  } catch (error) {
    console.error("[TelegramBot] Error in price menu:", error);
  }
}

export async function handleCourseSetPrice(courseId, amount, callbackQuery, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = callbackQuery?.message?.chat?.id;
  const messageId = callbackQuery?.message?.message_id;

  try {
    const num = Math.max(0, parseInt(amount, 10) || 0);
    await updateDoc(doc(db, "courses", courseId), {
      price: num,
      updatedAt: serverTimestamp(),
    });

    if (callbackQuery) {
      await answerCallbackQuery(token, callbackQuery.id, `Price updated to ৳${num}!`, false);
      if (chatId && messageId) {
        await handleCourseView(courseId, chatId, token, messageId);
      }
    }
    return { success: true, price: num };
  } catch (error) {
    console.error("[TelegramBot] Error updating price:", error);
    if (callbackQuery) {
      await answerCallbackQuery(token, callbackQuery.id, `Error: ${error.message}`, true);
    }
    return { success: false, error: error.message };
  }
}

export async function handleCourseDeleteConfirm(courseId, chatId, botToken, messageId = null) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  try {
    const snap = await getDoc(doc(db, "courses", courseId));
    if (!snap.exists()) return;
    const course = snap.data();

    const text = 
`⚠️ <b>CONFIRM COURSE DELETION</b>
━━━━━━━━━━━━━━━━━━━━
Are you sure you want to permanently delete:
\"<b>${course.title}</b>\"?

<i>This will remove the course from the catalog. Existing enrollments are preserved.</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "💥 Yes, Delete Permanently", callback_data: `course_del_do_${courseId}` },
          { text: "❌ Cancel", callback_data: `course_view_${courseId}` },
        ],
      ],
    };

    if (messageId) {
      return await editMessageText(token, chatId, messageId, text, { reply_markup: keyboard });
    } else {
      return await sendMessage(token, chatId, text, { reply_markup: keyboard });
    }
  } catch (error) {
    console.error("[TelegramBot] Error in delete confirm:", error);
  }
}

export async function handleCourseDeleteExecute(courseId, callbackQuery, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;

  try {
    await deleteDoc(doc(db, "courses", courseId));
    await answerCallbackQuery(token, callbackQuery.id, "Course deleted successfully!", true);
    await handleCoursesList(chatId, token, messageId);
  } catch (error) {
    console.error("[TelegramBot] Error deleting course:", error);
    await answerCallbackQuery(token, callbackQuery.id, `Error: ${error.message}`, true);
  }
}

// ==========================================
// 5. USER LOOKUP & ACCESS CONTROL
// ==========================================

export async function handleUserSearch(queryStr, chatId, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  if (!queryStr || !queryStr.trim()) {
    const text = 
`👤 <b>Search & Manage Platform Users</b>
━━━━━━━━━━━━━━━━━━━━
<b>Usage:</b> <code>/user &lt;email, phone, or name&gt;</code>

<i>Examples:</i>
• <code>/user student@gmail.com</code>
• <code>/user 01812345678</code>
• <code>/user Mahin</code>`;

    return await sendMessage(token, chatId, text, {
      reply_markup: { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "cmd_menu" }]] },
    });
  }

  const q = queryStr.toLowerCase().trim();

  try {
    const snap = await getDocs(collection(db, "users"));
    const matchedUsers = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((u) => {
        return (
          u.id.toLowerCase() === q ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.phoneNumber && u.phoneNumber.includes(q)) ||
          (u.phone && u.phone.includes(q))
        );
      })
      .slice(0, 3); // Top 3 matches

    if (matchedUsers.length === 0) {
      const text = `❌ <b>No user found</b> matching: <code>${queryStr}</code>\n\nPlease check spelling or try searching with a phone number or email address.`;
      return await sendMessage(token, chatId, text, {
        reply_markup: { inline_keyboard: [[{ text: "🔙 Main Menu", callback_data: "cmd_menu" }]] },
      });
    }

    for (const user of matchedUsers) {
      // Fetch user's approved courses
      const enrollmentsSnap = await getDocs(
        query(collection(db, "enrollments"), where("userId", "==", user.id), where("status", "==", "APPROVED"))
      );

      const enrolledCourseIds = enrollmentsSnap.docs.map((d) => d.data().courseId);
      let enrolledTitles = "None";
      if (enrolledCourseIds.length > 0) {
        const courseSnaps = await Promise.all(
          enrolledCourseIds.slice(0, 5).map((cId) => getDoc(doc(db, "courses", cId)))
        );
        enrolledTitles = courseSnaps
          .filter((s) => s.exists())
          .map((s) => `• ${s.data().title}`)
          .join("\n");
      }

      const isBanned = Boolean(user.banned);
      const userCardText = 
`👤 <b>User Profile: ${user.name || "Student"}</b>
━━━━━━━━━━━━━━━━━━━━
• <b>Name:</b> ${user.name || "N/A"}
• <b>Email:</b> <code>${user.email || "N/A"}</code>
• <b>Phone:</b> <code>${user.phoneNumber || user.phone || "N/A"}</code>
• <b>Role:</b> <code>${user.role || "user"}</code>
• <b>Status:</b> ${isBanned ? "🚫 <b>BANNED</b>" : "🟢 <b>Active</b>"}
• <b>User ID:</b> <code>${user.id}</code>

📚 <b>Enrolled Courses (${enrolledCourseIds.length}):</b>
${enrolledTitles}

<i>Manage access or status for this user:</i>`;

      const buttons = {
        inline_keyboard: [
          [
            { text: "➕ Grant Course Access", callback_data: `user_grant_${user.id}` },
            {
              text: isBanned ? "🟢 Unban User" : "🚫 Ban User",
              callback_data: `user_ban_${user.id}`,
            },
          ],
          [
            { text: "🔙 Main Menu", callback_data: "cmd_menu" },
          ],
        ],
      };

      await sendMessage(token, chatId, userCardText, { reply_markup: buttons });
    }
  } catch (error) {
    console.error("[TelegramBot] Error searching user:", error);
    return await sendMessage(token, chatId, `⚠️ Error searching user: ${error.message}`);
  }
}

export async function handleUserToggleBan(userId, callbackQuery, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = callbackQuery.message?.chat?.id;

  try {
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await answerCallbackQuery(token, callbackQuery.id, "User not found", true);
      return;
    }

    const currentBan = Boolean(snap.data().banned);
    const newBan = !currentBan;

    await updateDoc(userRef, {
      banned: newBan,
      bannedAt: newBan ? serverTimestamp() : null,
    });

    const statusMsg = newBan ? "User BANNED 🚫" : "User UNBANNED 🟢";
    await answerCallbackQuery(token, callbackQuery.id, statusMsg, true);
    await handleUserSearch(snap.data().email || userId, chatId, token);
  } catch (error) {
    console.error("[TelegramBot] Error toggling ban:", error);
    await answerCallbackQuery(token, callbackQuery.id, `Error: ${error.message}`, true);
  }
}

export async function handleUserGrantMenu(userId, chatId, botToken, messageId = null) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  try {
    const [userSnap, coursesSnap] = await Promise.all([
      getDoc(doc(db, "users", userId)),
      getDocs(collection(db, "courses")),
    ]);

    if (!userSnap.exists()) return;
    const user = userSnap.data();
    const courses = coursesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const text = 
`➕ <b>GRANT FREE COURSE ACCESS</b>
━━━━━━━━━━━━━━━━━━━━
Student: <b>${user.name || user.email}</b> (<code>${userId}</code>)

Select a course below to unlock full Telegram & platform access instantly for this student:`;

    const buttons = courses.slice(0, 15).map((c) => [
      { text: `📖 ${c.title.slice(0, 30)}`, callback_data: `user_grant_do_${userId}_${c.id}` },
    ]);

    buttons.push([{ text: "🔙 Cancel", callback_data: "cmd_menu" }]);

    if (messageId) {
      return await editMessageText(token, chatId, messageId, text, { reply_markup: { inline_keyboard: buttons } });
    } else {
      return await sendMessage(token, chatId, text, { reply_markup: { inline_keyboard: buttons } });
    }
  } catch (error) {
    console.error("[TelegramBot] Error in user grant menu:", error);
  }
}

export async function handleUserGrantExecute(userId, courseId, callbackQuery, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = callbackQuery.message?.chat?.id;

  try {
    const [userSnap, courseSnap] = await Promise.all([
      getDoc(doc(db, "users", userId)),
      getDoc(doc(db, "courses", courseId)),
    ]);

    if (!userSnap.exists() || !courseSnap.exists()) {
      await answerCallbackQuery(token, callbackQuery.id, "User or Course not found", true);
      return;
    }

    const user = userSnap.data();
    const course = courseSnap.data();

    // 1. userCourses
    await setDoc(doc(db, "userCourses", `${userId}_${courseId}`), {
      userId,
      courseId,
      enrolledAt: serverTimestamp(),
      progress: 0,
      grantedBy: "telegram_admin",
    });

    // 2. enrollments
    await addDoc(collection(db, "enrollments"), {
      userId,
      courseId,
      status: "APPROVED",
      approvedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      grantedBy: "telegram_admin",
    });

    // 3. payments record for full compatibility
    await addDoc(collection(db, "payments"), {
      userId,
      customerName: user.name || "Student",
      phoneNumber: user.phoneNumber || user.phone || "Admin Granted",
      paymentMethod: "Admin Manual",
      totalAmount: 0,
      status: "approved",
      submittedAt: serverTimestamp(),
      approvedAt: serverTimestamp(),
      courses: [
        {
          id: courseId,
          title: course.title,
          price: 0,
          status: "approved",
          approvedAt: new Date().toISOString(),
        },
      ],
    });

    await answerCallbackQuery(token, callbackQuery.id, `Course unlocked for ${user.name}!`, true);
    await sendMessage(
      token,
      chatId,
      `🎉 <b>Access Granted Successfully!</b>\n\n• Student: <b>${user.name || user.email}</b>\n• Course: <b>${course.title}</b>\n• Status: <b>APPROVED & UNLOCKED</b> ✅`
    );
  } catch (error) {
    console.error("[TelegramBot] Error granting course access:", error);
    await answerCallbackQuery(token, callbackQuery.id, `Error: ${error.message}`, true);
  }
}

// ==========================================
// 6. INSTANT WEBSITE ANNOUNCEMENT
// ==========================================

export async function handleAnnounceCommand(text, chatId, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  if (!text || !text.trim()) {
    const helpText = 
`📢 <b>Post Website Announcement</b>
━━━━━━━━━━━━━━━━━━━━
<b>Usage:</b> <code>/announce &lt;Message&gt;</code>
or: <code>/announce &lt;Title&gt; | &lt;Message&gt;</code>

<i>Examples:</i>
• <code>/announce ঈদ অফার: সকল কোর্সে ৫০% ডিসকাউন্ট!</code>
• <code>/announce New Batch | HSC 2026 Cycle 2 admission is now open!</code>

<i>This will immediately update the live announcement bar at the top of the website!</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🗑 Delete Latest Notice", callback_data: "announce_del_latest" },
          { text: "🔙 Main Menu", callback_data: "cmd_menu" },
        ],
      ],
    };

    return await sendMessage(token, chatId, helpText, { reply_markup: keyboard });
  }

  try {
    let title = "";
    let message = text.trim();

    if (text.includes("|")) {
      const parts = text.split("|");
      title = parts[0].trim();
      message = parts.slice(1).join("|").trim();
    }

    const fullNoticeText = title ? `${title}: ${message}` : message;
    const newItem = {
      id: String(Date.now()),
      text: fullNoticeText,
      order: 0,
      createdAt: new Date().toISOString(),
    };

    // 1. Update settings collection (used by AnnouncementBar)
    const settingsQ = query(collection(db, "settings"), where("type", "==", "announcements"));
    const settingsSnap = await getDocs(settingsQ);

    if (!settingsSnap.empty) {
      const existing = settingsSnap.docs[0].data();
      const items = Array.isArray(existing.items) ? existing.items : [];
      await updateDoc(doc(db, "settings", settingsSnap.docs[0].id), {
        enabled: true,
        items: [newItem, ...items],
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, "settings"), {
        type: "announcements",
        enabled: true,
        items: [newItem],
        updatedAt: serverTimestamp(),
      });
    }

    // 2. Add to announcements collection
    try {
      await addDoc(collection(db, "announcements"), {
        title: title || "Notice",
        message,
        text: fullNoticeText,
        active: true,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("[TelegramBot] Error writing to announcements collection:", e.message);
    }

    const confirmText = 
`📢 <b>ANNOUNCEMENT PUBLISHED!</b>
━━━━━━━━━━━━━━━━━━━━
\"<b>${fullNoticeText}</b>\"

✅ <i>Now active and scrolling on the website announcement bar!</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🗑 Delete This Notice", callback_data: "announce_del_latest" },
          { text: "🔙 Main Menu", callback_data: "cmd_menu" },
        ],
      ],
    };

    return await sendMessage(token, chatId, confirmText, { reply_markup: keyboard });
  } catch (error) {
    console.error("[TelegramBot] Error posting announcement:", error);
    return await sendMessage(token, chatId, `⚠️ Error publishing announcement: ${error.message}`);
  }
}

export async function handleDeleteLatestAnnouncement(callbackQuery, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  try {
    const settingsQ = query(collection(db, "settings"), where("type", "==", "announcements"));
    const snap = await getDocs(settingsQ);

    if (!snap.empty) {
      const data = snap.docs[0].data();
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length > 0) {
        const removed = items[0];
        const remaining = items.slice(1);
        await updateDoc(doc(db, "settings", snap.docs[0].id), {
          items: remaining,
          enabled: remaining.length > 0,
          updatedAt: serverTimestamp(),
        });

        await answerCallbackQuery(token, callbackQuery.id, "Latest notice removed!", true);
        return;
      }
    }

    await answerCallbackQuery(token, callbackQuery.id, "No active announcements to delete.", true);
  } catch (error) {
    console.error("[TelegramBot] Error deleting announcement:", error);
    await answerCallbackQuery(token, callbackQuery.id, `Error: ${error.message}`, true);
  }
}

// ==========================================
// 7. PAYMENT SETTINGS QUICK VIEW & UPDATE
// ==========================================

export async function getPaymentSettings() {
  try {
    const q = query(collection(db, "settings"), where("type", "==", "payment"));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const data = snap.docs[0].data();
      return {
        id: snap.docs[0].id,
        bkashNumber: data.bkashNumber || "01831952349",
        nagadNumber: data.nagadNumber || "01815307903",
        rocketNumber: data.rocketNumber || "",
      };
    }
  } catch (err) {
    console.error("[TelegramBot] Error getting payment settings:", err.message);
  }
  return {
    bkashNumber: "01831952349",
    nagadNumber: "01815307903",
    rocketNumber: "",
  };
}

export async function handlePaymentSettings(chatId, botToken, messageId = null) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  try {
    const settings = await getPaymentSettings();

    const text = 
`💳 <b>PAYMENT GATEWAY NUMBERS</b>
━━━━━━━━━━━━━━━━━━━━
Currently active checkout payment numbers:

• <b>bKash Personal:</b> <code>${settings.bkashNumber}</code>
• <b>Nagad Personal:</b> <code>${settings.nagadNumber}</code>
• <b>Rocket:</b> <code>${settings.rocketNumber || "Not configured"}</code>

<b>How to update payment numbers:</b>
• <code>/setbkash 01XXXXXXXXX</code>
• <code>/setnagad 01XXXXXXXXX</code>

<i>Example:</i> <code>/setbkash 01831952349</code>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🔄 Refresh Numbers", callback_data: "cmd_settings" },
          { text: "🔙 Main Menu", callback_data: "cmd_menu" },
        ],
      ],
    };

    if (messageId) {
      return await editMessageText(token, chatId, messageId, text, { reply_markup: keyboard });
    } else {
      return await sendMessage(token, chatId, text, { reply_markup: keyboard });
    }
  } catch (error) {
    console.error("[TelegramBot] Error in payment settings:", error);
    return await sendMessage(token, chatId, `⚠️ Error loading payment numbers: ${error.message}`);
  }
}

export async function handleSetPaymentNumber(method, numberStr, chatId, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  if (!numberStr || !numberStr.trim()) {
    return await sendMessage(
      token,
      chatId,
      `ℹ️ <b>Update ${method} Number</b>\n\nUsage: <code>/set${method.toLowerCase()} &lt;01XXXXXXXXX&gt;</code>\n\nExample: <code>/set${method.toLowerCase()} 01812345678</code>`
    );
  }

  const cleanNumber = numberStr.trim().replace(/\s+/g, "");
  if (!/^01\d{9}$/.test(cleanNumber)) {
    return await sendMessage(
      token,
      chatId,
      `⚠️ <b>Invalid Bangladeshi Phone Number!</b>\nNumber must be 11 digits starting with 01 (e.g. <code>01831952349</code>). You entered: <code>${cleanNumber}</code>`
    );
  }

  try {
    const q = query(collection(db, "settings"), where("type", "==", "payment"));
    const snap = await getDocs(q);
    const fieldName = method.toLowerCase() === "bkash" ? "bkashNumber" : "nagadNumber";

    if (!snap.empty) {
      await updateDoc(doc(db, "settings", snap.docs[0].id), {
        [fieldName]: cleanNumber,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, "settings"), {
        type: "payment",
        bkashNumber: method.toLowerCase() === "bkash" ? cleanNumber : "01831952349",
        nagadNumber: method.toLowerCase() === "nagad" ? cleanNumber : "01815307903",
        rocketNumber: "",
        updatedAt: serverTimestamp(),
      });
    }

    const text = 
`✅ <b>${method.toUpperCase()} NUMBER UPDATED!</b>
━━━━━━━━━━━━━━━━━━━━
New Number: <code>${cleanNumber}</code>

<i>This number is now active on the website checkout page.</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "💳 View Payment Settings", callback_data: "cmd_settings" },
          { text: "🔙 Main Menu", callback_data: "cmd_menu" },
        ],
      ],
    };

    return await sendMessage(token, chatId, text, { reply_markup: keyboard });
  } catch (error) {
    console.error(`[TelegramBot] Error setting ${method} number:`, error);
    return await sendMessage(token, chatId, `⚠️ Error updating ${method} number: ${error.message}`);
  }
}

// ==========================================
// 7.5 PROMO CODES / COUPONS MANAGEMENT
// ==========================================

export async function handleCouponsList(chatId, botToken, messageId = null) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();

  try {
    const snap = await getDocs(collection(db, "coupons"));
    const coupons = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    if (coupons.length === 0) {
      const text = 
`🎟 <b>PROMO CODES & COUPONS</b>
━━━━━━━━━━━━━━━━━━━━
<i>Zero promo codes found in the database.</i>

💡 <b>To create a promo code right now:</b>
Send: <code>/addpromo &lt;CODE&gt; &lt;AMOUNT&gt;</code>
• Flat Discount: <code>/addpromo VIP20 20</code> (৳20 OFF)
• Percent Discount: <code>/addpromo VIP10% 10%</code> (10% OFF)`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "🔄 Refresh", callback_data: "cmd_coupons" },
            { text: "🔙 Main Menu", callback_data: "cmd_menu" },
          ],
        ],
      };

      if (messageId) {
        return await editMessageText(token, chatId, messageId, text, { reply_markup: keyboard });
      } else {
        return await sendMessage(token, chatId, text, { reply_markup: keyboard });
      }
    }

    // Format list of coupons
    const couponsListText = coupons.map((c, i) => {
      const discountStr = c.type === "percentage" ? `${c.value}% OFF` : `৳${c.value} Flat OFF`;
      const statusStr = c.active !== false ? "🟢 Active" : "🔴 Inactive";
      const usageStr = `${c.usedCount || 0}${c.usageLimit ? `/${c.usageLimit}` : ""}`;
      return `<b>${i + 1}. <code>${c.code}</code></b> — ${discountStr}\n• Status: ${statusStr} | Used: <b>${usageStr}</b>`;
    }).join("\n\n");

    const text = 
`🎟 <b>PROMO CODES & COUPONS</b> (${coupons.length})
━━━━━━━━━━━━━━━━━━━━
${couponsListText}

💡 <b>Create new code:</b> <code>/addpromo &lt;CODE&gt; &lt;AMOUNT&gt;</code>
<i>(e.g., <code>/addpromo VIP20 20</code> or <code>/addpromo VIP10% 10%</code>)</i>`;

    const inlineKeyboard = [];

    // Add toggle and delete buttons for each coupon (up to 8 to fit nicely in message)
    coupons.slice(0, 8).forEach((c) => {
      const isActive = c.active !== false;
      inlineKeyboard.push([
        {
          text: `${isActive ? "🔴 Disable" : "🟢 Enable"} ${c.code}`,
          callback_data: `coupon_toggle_${c.id}`,
        },
        {
          text: `🗑 Delete ${c.code}`,
          callback_data: `coupon_del_${c.id}`,
        },
      ]);
    });

    inlineKeyboard.push([
      { text: "🔄 Refresh List", callback_data: "cmd_coupons" },
      { text: "🔙 Main Menu", callback_data: "cmd_menu" },
    ]);

    const keyboard = { inline_keyboard: inlineKeyboard };

    if (messageId) {
      return await editMessageText(token, chatId, messageId, text, { reply_markup: keyboard });
    } else {
      return await sendMessage(token, chatId, text, { reply_markup: keyboard });
    }
  } catch (error) {
    console.error("[TelegramBot] Error fetching coupons:", error);
    return await sendMessage(token, chatId, `⚠️ Error loading coupons: ${error.message}`);
  }
}

export async function handleCouponToggle(couponId, callbackQuery, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;

  try {
    const couponRef = doc(db, "coupons", couponId);
    const snap = await getDoc(couponRef);

    if (!snap.exists()) {
      await answerCallbackQuery(token, callbackQuery.id, "⚠️ Promo code not found!", true);
      return;
    }

    const currentData = snap.data();
    const newStatus = !currentData.active;

    await updateDoc(couponRef, {
      active: newStatus,
      updatedAt: serverTimestamp(),
    });

    await answerCallbackQuery(
      token,
      callbackQuery.id,
      `Code ${currentData.code} is now ${newStatus ? "ACTIVE" : "INACTIVE"}!`
    );

    // Refresh coupons list
    await handleCouponsList(chatId, token, messageId);
  } catch (error) {
    console.error("[TelegramBot] Error toggling coupon:", error);
    await answerCallbackQuery(token, callbackQuery.id, `Error: ${error.message}`, true);
  }
}

export async function handleCouponDelete(couponId, callbackQuery, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;

  try {
    const couponRef = doc(db, "coupons", couponId);
    const snap = await getDoc(couponRef);

    if (!snap.exists()) {
      await answerCallbackQuery(token, callbackQuery.id, "⚠️ Promo code not found!", true);
      return;
    }

    const currentData = snap.data();
    await deleteDoc(couponRef);

    await answerCallbackQuery(token, callbackQuery.id, `Code ${currentData.code} deleted!`);

    // Refresh coupons list
    await handleCouponsList(chatId, token, messageId);
  } catch (error) {
    console.error("[TelegramBot] Error deleting coupon:", error);
    await answerCallbackQuery(token, callbackQuery.id, `Error: ${error.message}`, true);
  }
}

export async function handleAddPromoCommand(argsStr, chatId, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const trimmed = (argsStr || "").trim();

  if (!trimmed) {
    const helpText = 
`ℹ️ <b>How to Create a Promo Code:</b>
<code>/addpromo &lt;CODE&gt; &lt;AMOUNT&gt;</code>

<b>Examples:</b>
• <code>/addpromo VIP20 20</code> (Flat ৳20 discount)
• <code>/addpromo HSC10 10%</code> (10% percentage discount)
• <code>/addpromo EID50 50</code> (Flat ৳50 discount)
• <code>/addpromo SPECIAL25 25%</code> (25% percentage discount)`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🎟 View All Promo Codes", callback_data: "cmd_coupons" },
          { text: "🔙 Main Menu", callback_data: "cmd_menu" },
        ],
      ],
    };

    return await sendMessage(token, chatId, helpText, { reply_markup: keyboard });
  }

  const parts = trimmed.split(/\s+/);
  const rawCode = parts[0];
  const rawAmount = parts[1];

  if (!rawCode || !rawAmount) {
    return await sendMessage(
      token,
      chatId,
      `⚠️ <b>Missing parameters!</b>\nUsage: <code>/addpromo &lt;CODE&gt; &lt;AMOUNT&gt;</code>\nExample: <code>/addpromo VIP20 20</code> or <code>/addpromo VIP10% 10%</code>`
    );
  }

  const cleanCode = rawCode.toUpperCase().replace(/[^A-Z0-9_%-]/g, "");
  const isPercent = rawAmount.includes("%") || rawCode.includes("%");
  const numericVal = parseFloat(rawAmount.replace(/[^0-9.]/g, ""));

  if (isNaN(numericVal) || numericVal <= 0) {
    return await sendMessage(
      token,
      chatId,
      `⚠️ <b>Invalid discount amount!</b> Please provide a positive number (e.g. <code>20</code> or <code>10%</code>).`
    );
  }

  if (isPercent && numericVal > 100) {
    return await sendMessage(
      token,
      chatId,
      `⚠️ Percentage discount cannot be greater than 100%!`
    );
  }

  const discountType = isPercent ? "percentage" : "fixed";

  try {
    // Check if code already exists
    const q = query(collection(db, "coupons"), where("code", "==", cleanCode));
    const snap = await getDocs(q);

    if (!snap.empty) {
      // Update existing coupon
      const existingDoc = snap.docs[0];
      await updateDoc(doc(db, "coupons", existingDoc.id), {
        type: discountType,
        value: numericVal,
        active: true,
        updatedAt: serverTimestamp(),
      });

      const text = 
`✅ <b>Promo Code Updated!</b>
━━━━━━━━━━━━━━━━━━━━
🎟 Code: <code>${cleanCode}</code>
💰 New Discount: <b>${discountType === "percentage" ? `${numericVal}% OFF` : `৳${numericVal} Flat OFF`}</b>
🟢 Status: <b>Active & Live on Checkout</b>`;

      const keyboard = {
        inline_keyboard: [
          [
            { text: "🎟 View All Promo Codes", callback_data: "cmd_coupons" },
            { text: "🔙 Main Menu", callback_data: "cmd_menu" },
          ],
        ],
      };

      return await sendMessage(token, chatId, text, { reply_markup: keyboard });
    }

    // Create new coupon
    await addDoc(collection(db, "coupons"), {
      code: cleanCode,
      type: discountType,
      value: numericVal,
      active: true,
      usedCount: 0,
      usageLimit: null,
      minPurchase: 0,
      createdBy: "telegram_admin",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const text = 
`🎉 <b>Promo Code Created Successfully!</b>
━━━━━━━━━━━━━━━━━━━━
🎟 Code: <code>${cleanCode}</code>
💰 Discount: <b>${discountType === "percentage" ? `${numericVal}% OFF` : `৳${numericVal} Flat OFF`}</b>
🟢 Status: <b>Active & Live on Website</b>

<i>Students can now enter this code on the Checkout page to receive their instant discount!</i>`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "🎟 View All Promo Codes", callback_data: "cmd_coupons" },
          { text: "🔙 Main Menu", callback_data: "cmd_menu" },
        ],
      ],
    };

    return await sendMessage(token, chatId, text, { reply_markup: keyboard });
  } catch (error) {
    console.error("[TelegramBot] Error creating promo code:", error);
    return await sendMessage(token, chatId, `⚠️ Error creating promo code: ${error.message}`);
  }
}

// ==========================================
// 8. APPROVE / REJECT EXISTING ORDER LOGIC
// ==========================================

export async function handleApproveOrder(paymentId, callbackQuery, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const callbackId = callbackQuery.id;
  const message = callbackQuery.message;
  const chatId = message?.chat?.id;
  const messageId = message?.message_id;
  const currentText = message?.text || "";

  try {
    const paymentRef = doc(db, "payments", paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      await answerCallbackQuery(token, callbackId, "⚠️ Order not found in database!", true);
      return;
    }

    const payment = paymentSnap.data();

    if (payment.status === "approved") {
      await answerCallbackQuery(token, callbackId, "Order is already approved!", false);
      const cleanText = currentText
        .replace(/\n\n🟢 Status:.*$/s, "")
        .replace(/\n\n🔴 Status:.*$/s, "");
      await editMessageText(token, chatId, messageId, `${cleanText}\n\n🟢 Status: APPROVED ✅`);
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
    await editMessageText(token, chatId, messageId, `${cleanText}\n\n🟢 Status: APPROVED ✅`);

    // 4. Send popup notification to Telegram user
    await answerCallbackQuery(token, callbackId, "Order Approved & Course Unlocked!", true);
    console.log(`[TelegramBot] Payment ${paymentId} APPROVED successfully via Telegram button.`);
  } catch (error) {
    console.error(`[TelegramBot] Error approving payment ${paymentId}:`, error);
    await answerCallbackQuery(token, callbackId, `Error approving order: ${error.message}`, true);
  }
}

export async function handleRejectOrder(paymentId, callbackQuery, botToken) {
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const callbackId = callbackQuery.id;
  const message = callbackQuery.message;
  const chatId = message?.chat?.id;
  const messageId = message?.message_id;
  const currentText = message?.text || "";

  try {
    const paymentRef = doc(db, "payments", paymentId);
    const paymentSnap = await getDoc(paymentRef);

    if (!paymentSnap.exists()) {
      await answerCallbackQuery(token, callbackId, "⚠️ Order not found in database!", true);
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
    await editMessageText(token, chatId, messageId, `${cleanText}\n\n🔴 Status: REJECTED ❌`);

    // 4. Send popup notification to Telegram user
    await answerCallbackQuery(token, callbackId, "Order Rejected!", true);
    console.log(`[TelegramBot] Payment ${paymentId} REJECTED successfully via Telegram button.`);
  } catch (error) {
    console.error(`[TelegramBot] Error rejecting payment ${paymentId}:`, error);
    await answerCallbackQuery(token, callbackId, `Error rejecting order: ${error.message}`, true);
  }
}

// ==========================================
// 9. CENTRAL CALLBACK QUERY DISPATCHER
// ==========================================

export async function handleTelegramCallbackQuery(callbackQuery, botToken) {
  if (!callbackQuery) return;
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const callbackData = (callbackQuery.data || "").trim();
  const chatId = callbackQuery.message?.chat?.id;
  const messageId = callbackQuery.message?.message_id;
  const fromId = callbackQuery.from?.id;

  // Enforce Admin Security
  if (!isTelegramAdmin(chatId, fromId)) {
    console.warn(`[TelegramBot] Unauthorized callback from chatId: ${chatId}, fromId: ${fromId}`);
    await answerCallbackQuery(token, callbackQuery.id, `⛔ Unauthorized! Your Telegram ID is ${fromId || chatId}`, true);
    return;
  }

  // Route callback buttons
  if (callbackData.startsWith("approve_")) {
    const paymentId = callbackData.replace("approve_", "").trim();
    await handleApproveOrder(paymentId, callbackQuery, token);
  } else if (callbackData.startsWith("reject_")) {
    const paymentId = callbackData.replace("reject_", "").trim();
    await handleRejectOrder(paymentId, callbackQuery, token);
  } else if (callbackData === "cmd_menu") {
    await answerCallbackQuery(token, callbackQuery.id);
    await sendAdminDashboard(chatId, token, messageId);
  } else if (callbackData === "cmd_stats") {
    await answerCallbackQuery(token, callbackQuery.id);
    await handleStatsCommand(chatId, token, messageId);
  } else if (callbackData === "cmd_pending") {
    await answerCallbackQuery(token, callbackQuery.id);
    await handlePendingOrders(chatId, token, messageId);
  } else if (callbackData === "cmd_courses") {
    await answerCallbackQuery(token, callbackQuery.id);
    await handleCoursesList(chatId, token, messageId);
  } else if (callbackData.startsWith("course_view_")) {
    const courseId = callbackData.replace("course_view_", "").trim();
    await answerCallbackQuery(token, callbackQuery.id);
    await handleCourseView(courseId, chatId, token, messageId);
  } else if (callbackData.startsWith("course_toggle_")) {
    const courseId = callbackData.replace("course_toggle_", "").trim();
    await handleCourseToggle(courseId, callbackQuery, token);
  } else if (callbackData.startsWith("course_price_menu_")) {
    const courseId = callbackData.replace("course_price_menu_", "").trim();
    await answerCallbackQuery(token, callbackQuery.id);
    await handleCoursePriceMenu(courseId, chatId, token, messageId);
  } else if (callbackData.startsWith("course_setprice_")) {
    const parts = callbackData.replace("course_setprice_", "").split("_");
    const courseId = parts[0];
    const amount = parts[1];
    await handleCourseSetPrice(courseId, amount, callbackQuery, token);
  } else if (callbackData.startsWith("course_del_ask_")) {
    const courseId = callbackData.replace("course_del_ask_", "").trim();
    await answerCallbackQuery(token, callbackQuery.id);
    await handleCourseDeleteConfirm(courseId, chatId, token, messageId);
  } else if (callbackData.startsWith("course_del_do_")) {
    const courseId = callbackData.replace("course_del_do_", "").trim();
    await handleCourseDeleteExecute(courseId, callbackQuery, token);
  } else if (callbackData === "cmd_users_help") {
    await answerCallbackQuery(token, callbackQuery.id);
    await handleUserSearch("", chatId, token);
  } else if (callbackData.startsWith("user_ban_")) {
    const userId = callbackData.replace("user_ban_", "").trim();
    await handleUserToggleBan(userId, callbackQuery, token);
  } else if (callbackData.startsWith("user_grant_do_")) {
    const parts = callbackData.replace("user_grant_do_", "").split("_");
    const userId = parts[0];
    const courseId = parts[1];
    await handleUserGrantExecute(userId, courseId, callbackQuery, token);
  } else if (callbackData.startsWith("user_grant_")) {
    const userId = callbackData.replace("user_grant_", "").trim();
    await answerCallbackQuery(token, callbackQuery.id);
    await handleUserGrantMenu(userId, chatId, token, messageId);
  } else if (callbackData === "cmd_announce_help") {
    await answerCallbackQuery(token, callbackQuery.id);
    await handleAnnounceCommand("", chatId, token);
  } else if (callbackData === "announce_del_latest") {
    await handleDeleteLatestAnnouncement(callbackQuery, token);
  } else if (callbackData === "cmd_settings") {
    await answerCallbackQuery(token, callbackQuery.id);
    await handlePaymentSettings(chatId, token, messageId);
  } else if (callbackData === "cmd_coupons") {
    await answerCallbackQuery(token, callbackQuery.id);
    await handleCouponsList(chatId, token, messageId);
  } else if (callbackData.startsWith("coupon_toggle_")) {
    const couponId = callbackData.replace("coupon_toggle_", "").trim();
    await handleCouponToggle(couponId, callbackQuery, token);
  } else if (callbackData.startsWith("coupon_del_")) {
    const couponId = callbackData.replace("coupon_del_", "").trim();
    await handleCouponDelete(couponId, callbackQuery, token);
  } else {
    await answerCallbackQuery(token, callbackQuery.id, "Action processed");
  }
}

// ==========================================
// 10. CENTRAL TEXT COMMAND DISPATCHER
// ==========================================

export async function handleTelegramMessage(message, botToken) {
  if (!message || !message.text) return;
  const token = botToken || (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  const text = message.text.trim();
  const chatId = message.chat?.id;
  const fromId = message.from?.id;

  // Enforce Admin Security
  if (!isTelegramAdmin(chatId, fromId)) {
    console.warn(`[TelegramBot] Unauthorized message attempt from chatId: ${chatId}, fromId: ${fromId}`);
    await sendMessage(
      token,
      chatId,
      `⛔ <b>Access Denied: VIP Admin Only</b>\n\nThis Telegram Bot is restricted to authorized platform administrators.\n\nYour Telegram ID: <code>${fromId || chatId}</code>\n<i>To authorize, add this ID to TELEGRAM_CHAT_ID in environment variables.</i>`
    );
    return;
  }

  // Parse command & arguments (e.g., /user student@gmail.com, /announce Hello, /setbkash 018...)
  const parts = text.split(/\s+/);
  const command = parts[0].toLowerCase().split("@")[0]; // handle /command@bot_name
  const args = parts.slice(1);
  const fullArgs = text.substring(parts[0].length).trim();

  switch (command) {
    case "/start":
    case "/admin":
    case "/menu":
      await sendAdminDashboard(chatId, token);
      break;

    case "/stats":
      await handleStatsCommand(chatId, token);
      break;

    case "/pending":
      await handlePendingOrders(chatId, token);
      break;

    case "/courses":
      await handleCoursesList(chatId, token);
      break;

    case "/coupons":
    case "/promo":
    case "/promos":
      await handleCouponsList(chatId, token);
      break;

    case "/addpromo":
    case "/createpromo":
      await handleAddPromoCommand(fullArgs, chatId, token);
      break;

    case "/user":
      await handleUserSearch(fullArgs, chatId, token);
      break;

    case "/announce":
      await handleAnnounceCommand(fullArgs, chatId, token);
      break;

    case "/setbkash":
      await handleSetPaymentNumber("bKash", fullArgs, chatId, token);
      break;

    case "/setnagad":
      await handleSetPaymentNumber("Nagad", fullArgs, chatId, token);
      break;

    case "/setprice":
      if (args.length >= 2) {
        const courseId = args[0];
        const price = args[1];
        const res = await handleCourseSetPrice(courseId, price, null, token);
        if (res.success) {
          await sendMessage(token, chatId, `✅ Price for course <code>${courseId}</code> updated to <b>৳${res.price}</b>!`);
        } else {
          await sendMessage(token, chatId, `⚠️ Error: ${res.error}`);
        }
      } else {
        await sendMessage(token, chatId, `ℹ️ Usage: <code>/setprice &lt;courseId&gt; &lt;amount&gt;</code>\nExample: <code>/setprice 102 500</code>`);
      }
      break;

    case "/help":
      await sendMessage(
        token,
        chatId,
        `👑 <b>VIP Admin Commands Guide</b>\n━━━━━━━━━━━━━━━━━━━━\n• <code>/menu</code> — Open Admin Control Dashboard\n• <code>/stats</code> — Live Platform & Revenue Analytics\n• <code>/pending</code> — Pending Orders Queue & Action\n• <code>/courses</code> — Manage Courses, Status & Prices\n• <code>/coupons</code> — Manage Promo Codes & Discounts\n• <code>/addpromo &lt;CODE&gt; &lt;AMOUNT&gt;</code> — Create Discount Code\n• <code>/user &lt;query&gt;</code> — Search User & Grant Access\n• <code>/announce &lt;msg&gt;</code> — Post Website Announcement\n• <code>/setbkash &lt;num&gt;</code> — Update bKash Number\n• <code>/setnagad &lt;num&gt;</code> — Update Nagad Number\n• <code>/setprice &lt;id&gt; &lt;num&gt;</code> — Update Course Price`
      );
      break;

    default:
      // For general unrecognized message, offer main dashboard menu
      await sendAdminDashboard(chatId, token);
      break;
  }
}

// ==========================================
// 11. BACKGROUND POLLING LOOP (Local Dev)
// ==========================================

export async function startTelegramPolling() {
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    console.log("[TelegramBot] Running in production/serverless environment — Webhook mode active.");
    return;
  }

  if (isPolling) {
    return;
  }

  const botToken = (process.env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!botToken) {
    console.warn("[TelegramBot] TELEGRAM_BOT_TOKEN not configured. Polling not started.");
    return;
  }

  // Register commands on startup
  await registerBotCommands(botToken);

  // Check if production webhook is active
  try {
    const webhookInfoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
    const webhookInfo = await webhookInfoRes.json().catch(() => ({}));
    if (webhookInfo.ok && webhookInfo.result?.url) {
      console.log(`[TelegramBot] Production webhook is active (${webhookInfo.result.url}). Webhook handles Telegram callbacks.`);
      return;
    }
  } catch (err) {
    console.warn("[TelegramBot] Webhook check notice:", err.message);
  }

  isPolling = true;
  console.log("[TelegramBot] Webhook not active. Starting background Telegram polling (Local Mode)...");

  // Polling loop
  (async function pollLoop() {
    while (isPolling) {
      try {
        const allowedUpdates = JSON.stringify(["message", "callback_query"]);
        const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${pollingOffset}&timeout=20&allowed_updates=${encodeURIComponent(allowedUpdates)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
        const data = await res.json().catch(() => ({}));

        if (data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            pollingOffset = Math.max(pollingOffset, update.update_id + 1);
            if (update.callback_query) {
              await handleTelegramCallbackQuery(update.callback_query, botToken);
            } else if (update.message) {
              await handleTelegramMessage(update.message, botToken);
            }
          }
        } else if (!data.ok) {
          await new Promise((r) => setTimeout(r, 3000));
        }
      } catch (pollErr) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  })();
}
