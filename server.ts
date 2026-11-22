import express from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { catalogRouter } from './src/server/routes-catalog.ts';
import { salesRouter } from './src/server/routes-sales.ts';
import { purchasesRouter } from './src/server/routes-purchases.ts';
import { customersRouter } from './src/server/routes-customers.ts';
import { portalRouter } from './src/server/routes-portal.ts';
import { financeRouter } from './src/server/routes-finance.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lightweight WebSocket-free /@vite/client shim for proxied environments where HMR WebSockets are disabled
const NO_WS_VITE_CLIENT = `
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  const hot = {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
  return hot;
}
export function injectQuery(url) { return url; }
export class ErrorOverlay extends HTMLElement {}
`;

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '6mb' }));

  // Allow cross-origin API access from Firebase Hosting (mudidokanpro.web.app / mudipro.web.app) and configured origins
  const defaultAllowedOrigins = [
    'https://mudidokanpro.web.app',
    'https://mudidokanpro.firebaseapp.com',
    'https://mudipro-2c4b2.web.app',
    'https://mudipro-2c4b2.firebaseapp.com',
    'https://mudipro.web.app',
    'https://mudipro.firebaseapp.com',
    'https://vaulted-path-r91ww.web.app',
    'https://vaulted-path-r91ww.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5173',
  ];
  const extraOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const allowedOrigins = new Set([...defaultAllowedOrigins, ...extraOrigins]);

  app.use((req, res, next) => {
    const origin = req.headers.origin?.replace(/\/$/, '');
    if (origin && (allowedOrigins.has(origin) || allowedOrigins.has('*'))) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With');
    }
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    next();
  });

  // Ensure disk storage directories exist for optimized product/brand/store images
  const uploadsDir = path.resolve(__dirname, 'public/uploads');
  const catalogDir = path.resolve(__dirname, 'public/catalog');
  const imagesDir = path.resolve(__dirname, 'public/images');
  fs.mkdirSync(path.join(uploadsDir, 'products'), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'brands'), { recursive: true });
  fs.mkdirSync(path.join(uploadsDir, 'stores'), { recursive: true });
  fs.mkdirSync(path.join(imagesDir, 'products'), { recursive: true });

  app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));
  app.use('/catalog', express.static(catalogDir, { maxAge: '30d' }));
  app.use('/images', express.static(imagesDir, { maxAge: '30d' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'MudirDokan Pro API' });
  });

  // Staff API routes (Firebase Auth protected)
  app.use('/api/catalog', catalogRouter);
  app.use('/api/sales', salesRouter);
  app.use('/api/purchases', purchasesRouter);
  app.use('/api/customers', customersRouter);
  app.use('/api/finance', financeRouter);

  // Isolated Customer Self-Service Portal API (Mobile OTP + HMAC Session protected)
  app.use('/api/portal', portalRouter);

  // Vite dev middleware in development, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    // Serve WebSocket-free Vite client shim before Vite middlewares to prevent HMR WebSocket errors
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript; charset=utf-8').send(NO_WS_VITE_CLIENT);
    });

    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MudirDokan Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MudirDokan Pro server:', err);
  process.exit(1);
});
