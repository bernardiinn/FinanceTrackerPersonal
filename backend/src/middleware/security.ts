import { Request, Response, NextFunction } from 'express';

// Double-submit style CSRF middleware with gradual enforcement
// - Generates a CSRF token per session and sets a readable cookie "XSRF-TOKEN"
// - For state-changing methods, verifies X-CSRF-Token header when REQUIRE_CSRF=1
// - In lax mode (default), logs a warning but allows if header missing

export const setCsrfTokenCookie = (_req: Request, res: Response, token: string): void => {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('XSRF-TOKEN', token, {
    sameSite: 'lax',
    httpOnly: false,
    secure,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });
};

export const csrfMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const method = req.method.toUpperCase();
  const isSafe = method === 'GET' || method === 'HEAD' || method === 'OPTIONS';

  // Ensure token exists and cookie is set
  if (!(req.session as any).csrfToken) {
    (req.session as any).csrfToken = require('crypto').randomBytes(32).toString('hex');
  }
  setCsrfTokenCookie(req, res, (req.session as any).csrfToken);

  if (isSafe) return next();

  // Allowlist some endpoints that commonly run before CSRF is established
  const allowlist = ['/api/auth/login', '/api/auth/signup', '/api/auth/logout', '/api/health'];
  if (allowlist.includes(req.path) || allowlist.some(p => req.originalUrl.startsWith(p))) {
    return next();
  }

  const headerToken = req.header('X-CSRF-Token');
  const sessionToken = (req.session as any).csrfToken as string;
  const enforce = process.env.REQUIRE_CSRF === '1';

  if (!headerToken || headerToken !== sessionToken) {
    if (enforce) {
      res.status(403).json({ error: 'Invalid or missing CSRF token' });
      return;
    }
    // Lax mode: log and continue
    console.warn('[csrf] missing/invalid token for', req.method, req.originalUrl);
  }

  next();
};

// Simple in-memory rate limiter (per IP + key)
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

const rateLimit = (key: string, limit: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    const bucketKey = `${key}:${ip}`;
    const now = Date.now();
    const existing = buckets.get(bucketKey);
    if (!existing || existing.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (existing.count < limit) {
      existing.count += 1;
      return next();
    }
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000);
    res.setHeader('Retry-After', String(retryAfter));
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  };
};

// Export specialized limiters
export const limitLogin = rateLimit('login', 10, 15 * 60 * 1000); // 10 attempts / 15min per IP
export const limitPin = rateLimit('pin', 20, 15 * 60 * 1000); // 20 attempts / 15min per IP (IP-only; per-user handled in DB)
