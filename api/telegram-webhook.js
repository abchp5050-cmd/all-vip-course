import { handleTelegramCallbackQuery, registerTelegramWebhook } from './_utils/telegram-bot-service.js';

try {
  if (process.loadEnvFile && !process.env.TELEGRAM_BOT_TOKEN) {
    process.loadEnvFile();
  }
} catch (e) {
  // Ignore if .env is missing or already loaded
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: Health check, webhook diagnostics, or setup (?setup=1)
  if (req.method === 'GET') {
    try {
      const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
      if (!botToken) {
        return res.status(200).json({
          ok: false,
          error: 'TELEGRAM_BOT_TOKEN not configured in environment'
        });
      }

      // If requested ?setup=1 or ?register=1, re-register webhook with Telegram
      if (req.query?.setup === '1' || req.query?.register === '1') {
        const setupResult = await registerTelegramWebhook();
        return res.status(200).json({
          ok: true,
          message: 'Webhook registration triggered',
          result: setupResult
        });
      }

      // Default GET: inspect current webhook configuration on Telegram
      const infoRes = await fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`);
      const infoData = await infoRes.json().catch(() => ({}));
      return res.status(200).json({
        ok: true,
        endpoint: 'telegram-webhook',
        message: 'Telegram webhook receiver is active and healthy',
        webhookInfo: infoData
      });
    } catch (err) {
      return res.status(200).json({ ok: false, error: err.message });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const update = req.body || {};

    // Check if update contains a callback_query (Approve / Reject buttons)
    if (update.callback_query) {
      await handleTelegramCallbackQuery(update.callback_query);
    }

    // Always respond 200 OK to Telegram so it acknowledges delivery
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[TelegramWebhook] Error handling incoming update:', error);
    // Return 200 to prevent Telegram retry storm on unhandled internal error
    return res.status(200).json({ ok: false, error: error.message });
  }
}
