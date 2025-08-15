import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { initializeDatabase } from './database';
import transactionRoutes from './routes/transactions';
import authRoutes from './routes/auth';
import goalRoutes from './routes/goals';
import loanRoutes from './routes/loans';
import recurringTransactionRoutes from './routes/recurringTransactions';
import receiptRoutes from './routes/receipts';
// Use require to avoid type resolution issues for local middleware
// eslint-disable-next-line @typescript-eslint/no-var-requires
const security = require('./middleware/security');
import { runQuery } from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Trust proxy if behind one (needed for secure cookies when proxied)
if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    // Use secure cookies in production (when served over HTTPS) or when TRUST_PROXY is set
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 1 day (default, can be extended with rememberMe)
  },
  // Extend session on activity
  rolling: true,
}));

// CORS configuration with credentials
app.use(cors({
  origin: 'http://0.0.0.0:4173', // Frontend URL for VM
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

app.use(express.json());

// CSRF token endpoint: sets a non-HttpOnly cookie and returns token for client to send back in X-CSRF-Token
app.get('/api/csrf-token', (req, res) => {
  // Initialize CSRF token in session if not present
  if (!(req.session as any).csrfToken) {
    (req.session as any).csrfToken = crypto.randomBytes(32).toString('hex');
  }
  // Also set a readable cookie for convenience (not HttpOnly)
  security.setCsrfTokenCookie(req, res, (req.session as any).csrfToken);
  res.json({ csrfToken: (req.session as any).csrfToken });
});

// Routes
// Apply CSRF middleware to API routes (safe methods are skipped internally). Allowlist some auth/health routes.
app.use('/api/auth', security.csrfMiddleware, authRoutes);
app.use('/api/transactions', security.csrfMiddleware, transactionRoutes);
app.use('/api/goals', security.csrfMiddleware, goalRoutes);
app.use('/api/loans', security.csrfMiddleware, loanRoutes);
app.use('/api/recurring-transactions', security.csrfMiddleware, recurringTransactionRoutes);
app.use('/api/receipts', security.csrfMiddleware, receiptRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Finance Tracker API is running' });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();
    
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
      console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
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
