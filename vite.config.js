import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Replit serves the dev server behind a TLS proxy on port 443, so HMR must
// connect over wss on 443 there. Locally we let Vite use its defaults so that
// `npm run dev` works without websocket connection errors.
const isReplit = Boolean(process.env.REPL_ID);

const hmr = isReplit ? { clientPort: 443, protocol: 'wss' } : undefined;

export default defineConfig({
  base: '/', 
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5050,
    strictPort: true,
    allowedHosts: true,
    hmr,
  },
  preview: {
    host: '0.0.0.0',
    port: 5050,
    strictPort: true,
  },
});
