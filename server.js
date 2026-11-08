import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import createPaymentHandler from './api/create-payment.js';
import verifyPaymentHandler from './api/verify-payment.js';
import paymentWebhookHandler from './api/payment-webhook.js';
import uploadImageHandler from './api/upload-image.js';
import processEnrollmentHandler from './api/process-enrollment.js';
import dynamicManifestHandler from './api/dynamic-manifest.js';
import getTelegramLinkHandler from './api/get-telegram-link.js';
import updateEnrollmentStatusHandler from './api/update-enrollment-status.js';
import sendOrderNotificationHandler from './api/send-order-notification.js';
import { startTelegramPolling } from './api/telegram-bot-service.js';

try {
  if (process.loadEnvFile) {
    process.loadEnvFile();
  }
} catch (e) {
  // .env may not exist or already loaded
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Parse command line arguments for port
const args = process.argv.slice(2);
let portArg = 5050; // Default to 5050
const portIndex = args.indexOf('--port');
if (portIndex > -1 && args.length > portIndex + 1) {
  portArg = parseInt(args[portIndex + 1], 10);
}

const app = express();
const PORT = process.env.PORT || portArg;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

app.disable('x-powered-by');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers for all responses
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Non-cached responses specifically for dynamic API routes
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.get('/api/manifest.json', (req, res) => {
  dynamicManifestHandler(req, res);
});

app.post('/api/create-payment', (req, res) => {
  createPaymentHandler(req, res);
});

app.post('/api/verify-payment', (req, res) => {
  verifyPaymentHandler(req, res);
});

app.post('/api/payment-webhook', (req, res) => {
  paymentWebhookHandler(req, res);
});

app.post('/api/process-enrollment', (req, res) => {
  processEnrollmentHandler(req, res);
});

app.post('/api/upload-image', (req, res) => {
  uploadImageHandler(req, res);
});

app.post('/api/get-telegram-link', (req, res) => {
  getTelegramLinkHandler(req, res);
});

app.post('/api/update-enrollment-status', (req, res) => {
  updateEnrollmentStatusHandler(req, res);
});

app.post('/api/send-order-notification', (req, res) => {
  sendOrderNotificationHandler(req, res);
});

if (IS_PRODUCTION) {
  const distPath = join(__dirname, 'dist');
  app.use(express.static(distPath, {
    setHeaders: (res, filePath) => {
      if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)$/i.test(filePath)) {
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, must-revalidate');
      }
    }
  }));
  
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.sendFile(join(distPath, 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const isReplit = Boolean(process.env.REPL_ID);
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      host: '0.0.0.0',
      port: PORT,
      strictPort: true,
      hmr: isReplit ? { clientPort: 443, protocol: 'wss' } : undefined,
    },
    appType: 'spa',
  });
  
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${IS_PRODUCTION ? 'production' : 'development'}`);
  console.log(`Serving from: ${IS_PRODUCTION ? 'dist/' : 'vite dev server'}`);

  // Automatically start background Telegram polling for interactive Approve/Reject buttons
  startTelegramPolling();
});
