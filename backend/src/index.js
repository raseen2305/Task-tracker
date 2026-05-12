import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import rateLimit from 'express-rate-limit';

import authRoutes     from './routes/auth.js';
import taskRoutes     from './routes/tasks.js';
import projectRoutes  from './routes/projects.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes     from './routes/users.js';
import batchRoutes    from './routes/batches.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

// ── Trust Railway's reverse proxy (fixes rate-limiter X-Forwarded-For error) ─
app.set('trust proxy', 1);

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// Allow any origin in production so Railway domain always works
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);
    // Allow localhost for local dev
    if (origin.includes('localhost')) return callback(null, true);
    // Allow any railway.app subdomain
    if (origin.includes('railway.app')) return callback(null, true);
    // Allow explicitly configured FRONTEND_URL
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    callback(null, true); // permissive — tighten after go-live if needed
  },
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/projects',  projectRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/batches',   batchRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Serve frontend ────────────────────────────────────────────────────────────
// Serve whenever the public folder exists — not gated on NODE_ENV
const publicPath = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  // SPA fallback — all non-API routes return index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.json({ status: 'API running', note: 'Frontend not built yet' });
  });
}

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Ethara-Sync API running on port ${PORT}`);
  console.log(`   Frontend: ${fs.existsSync(publicPath) ? 'serving from /public' : 'NOT FOUND — API only mode'}`);
});

export default app;
