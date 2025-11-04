# Required Credentials Setup for All Vip Course

To make all features work, you need to provide the following API keys and credentials:

## 1. ImgBB API Key
**Used for**: Image uploads in admin panel when adding/editing courses

**How to get it**:
1. Go to https://api.imgbb.com/
2. Create a free account
3. Go to API section
4. Generate a new API key

**How to add it to Replit**:
- Go to Secrets (lock icon in Replit sidebar)
- Add new secret: `IMGBB_API_KEY` = `your_api_key_here`

---

## 2. RupantorPay API Key
**Used for**: Payment processing (Bangladesh payment gateway)

**How to get it**:
1. Log in to your RupantorPay merchant dashboard
2. Go to API/Developer section
3. Copy your API key

**How to add it to Replit**:
- Go to Secrets
- Add new secret: `RUPANTORPAY_API_KEY` = `your_api_key_here`

---

## 3. Firebase Admin SDK Service Account
**Used for**: Secure server-side operations (enrollment approval, Telegram link retrieval)

**How to get it**:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `easy-education-real`
3. Click the gear icon ⚙️ → Project settings
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. A JSON file will download

**How to add it to Replit**:
- Go to Secrets
- Add new secret: `FIREBASE_SERVICE_ACCOUNT_KEY`
- Value: Paste the ENTIRE content of the downloaded JSON file (as one line or formatted)

Example format:
```json
{
  "type": "service_account",
  "project_id": "easy-education-real",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "...",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

---

## 4. Telegram Bot Token (Optional)
**Used for**: Telegram group notifications (if you want to use this feature)

**How to get it**:
1. Open Telegram
2. Search for @BotFather
3. Send `/newbot` and follow instructions
4. Copy the bot token

**How to add it to Replit**:
- Go to Secrets
- Add new secret: `NEXT_PUBLIC_TELEGRAM_BOT_TOKEN` = `your_bot_token_here`

---

## After Adding Credentials

1. Restart the server (click Stop → Run in Replit)
2. Check console for success messages:
   - ✅ Firebase Admin initialized successfully
   - ✅ Server running on port 5000

## Testing Features

Once all credentials are added:

1. **Test Image Upload**: Go to Admin → Courses → Add/Edit course → Upload image
2. **Test Payment**: Make a test purchase and verify payment processing works
3. **Test Enrollment Approval**: 
   - Make a purchase → Admin → Enrollments → Approve
   - User should then see the course with "Join Telegram" button
4. **Test Telegram Join**: Click "Join Telegram Group" → Should open Telegram app

---

## Troubleshooting

**"Firebase Admin not initialized"**:
- Make sure `FIREBASE_SERVICE_ACCOUNT_KEY` is correctly formatted JSON
- Restart the server after adding the secret

**"Payment service key missing"**:
- Add `RUPANTORPAY_API_KEY` to secrets

**"Image service key missing"**:
- Add `IMGBB_API_KEY` to secrets

**Telegram link not working**:
- Make sure course has `telegramGroupLink` set in Firestore
- Link should use `tg://` format or `https://t.me/` format
- User's enrollment must be APPROVED
