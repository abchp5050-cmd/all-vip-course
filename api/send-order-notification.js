export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
    });
  }

  try {
    if (process.loadEnvFile && !process.env.TELEGRAM_BOT_TOKEN) {
      try {
        process.loadEnvFile();
      } catch (e) {
        // Ignore if .env is missing or already loaded
      }
    }

    const botToken = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
    const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim();

    if (!botToken || !chatId) {
      console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured');
      return res.status(200).json({
        success: false,
        warning: 'Telegram notifications are not configured'
      });
    }

    const {
      payment_id,
      paymentId,
      course_name,
      student_name,
      payment_number,
      payment_method,
      telegram_id_name,
      telegram_username,
      amount,
      promo_code,
      date_time
    } = req.body || {};

    const targetPaymentId = (payment_id || paymentId || '').trim();

    const formattedMessage = [
      '🎓 New Course Order Received',
      '',
      '📚 Course:',
      course_name || 'N/A',
      '',
      '👤 Student Name:',
      student_name || 'N/A',
      '',
      '📱 Payment Number:',
      payment_number || 'N/A',
      '',
      '💳 Payment Method:',
      payment_method || 'N/A',
      '',
      '👤 Telegram ID Name:',
      telegram_id_name || 'N/A',
      '',
      '🆔 Telegram Username:',
      telegram_username || 'N/A',
      '',
      '💰 Amount:',
      amount || 'N/A',
      ...(promo_code ? ['', '🎟 Promo Code:', promo_code] : []),
      '',
      '⏰ Order Time:',
      date_time || new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' })
    ].join('\n');

    const messagePayload = {
      chat_id: chatId,
      text: formattedMessage
    };

    if (targetPaymentId) {
      messagePayload.reply_markup = {
        inline_keyboard: [
          [
            { text: "✅ Approve Order", callback_data: `approve_${targetPaymentId}` },
            { text: "❌ Reject Order", callback_data: `reject_${targetPaymentId}` }
          ]
        ]
      };
    }

    const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    const telegramData = await telegramRes.json().catch(() => ({}));

    if (!telegramRes.ok || !telegramData.ok) {
      console.warn('Telegram API notification warning:', telegramData);
      return res.status(200).json({
        success: false,
        warning: 'Telegram notification could not be delivered',
        details: telegramData
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    // Return 200 with success: false so client flow never breaks
    return res.status(200).json({
      success: false,
      error: error.message
    });
  }
}
