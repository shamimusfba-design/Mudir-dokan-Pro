import express from 'express';
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

async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '5mb' }));

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
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: { server: httpServer },
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
        ws: { server: httpServer },
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
