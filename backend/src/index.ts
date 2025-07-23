import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import { initializeDatabase } from './database';
import transactionRoutes from './routes/transactions';
import authRoutes from './routes/auth';
import goalRoutes from './routes/goals';
import loanRoutes from './routes/loans';
import recurringTransactionRoutes from './routes/recurringTransactions';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  }
}));

// CORS configuration with credentials
app.use(cors({
  origin: 'http://0.0.0.0:4173', // Frontend URL for VM
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/recurring-transactions', recurringTransactionRoutes);

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
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
