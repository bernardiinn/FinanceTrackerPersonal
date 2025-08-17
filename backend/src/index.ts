import express from 'express';
import cors from 'cors';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { initializeDatabase } from './database';
import transactionRoutes from './routes/transactions';
import authRoutes from './routes/auth';
import goalRoutes from './routes/goals';
import loanRoutes from './routes/loans';
import recurringTransactionRoutes from './routes/recurringTransactions';
import receiptRoutes from './routes/receipts';
import { xsrfTokenIssuer, csrfProtector } from './middleware/security';
import { runQuery } from './database';

// Load .env only outside production so systemd EnvironmentFile takes precedence
if (process.env.NODE_ENV !== 'production' && !process.env.ENV_FILE) {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3003;
// Determine cookie security flags (allow override to force insecure for HTTP testing)
const INSECURE = process.env.FORCE_INSECURE_COOKIES === '1' || process.env.USE_SECURE === '0';
const secureCookies = !INSECURE && process.env.NODE_ENV === 'production';
const ORIGINS = (process.env.CORS_ORIGIN || 'http://0.0.0.0:4173,http://localhost:4173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-insecure-session-secret',
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookies,
    maxAge: 1000 * 60 * 60 * 24
  }
}));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow same-origin / curl
    return ORIGINS.includes(origin) ? cb(null, true) : cb(new Error('CORS blocked'), false);
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-XSRF-TOKEN']
}));

app.use(cookieParser());
app.use(express.json());

// XSRF + CSRF (mutating methods only; safe & exempt paths bypass)
app.use(xsrfTokenIssuer({ secure: secureCookies }));
app.use(csrfProtector({
  exemptPaths: [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/login-pin',
    '/api/auth/logout'
  ]
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/recurring-transactions', recurringTransactionRoutes);
app.use('/api/receipts', receiptRoutes);

// Health
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Finance Tracker API is running' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server listening on http://0.0.0.0:${PORT}`);
      console.log(`Health: http://0.0.0.0:${PORT}/api/health`);
    });

    // Periodic cleanup for expired trusted devices and stale lockouts (every 6 hours)
    const sixHours = 1000 * 60 * 60 * 6;
    setInterval(async () => {
      try {
        await runQuery('DELETE FROM trusted_devices WHERE expires_at <= datetime("now")');
        await runQuery('DELETE FROM pin_attempts WHERE locked_until IS NOT NULL AND locked_until <= datetime("now")');
        console.log('[cleanup] expired devices and lockouts cleaned');
      } catch (e) {
        console.error('[cleanup] error:', e);
      }
    }, sixHours);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
