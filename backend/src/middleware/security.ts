import type { Request, Response, NextFunction } from 'express';
// Ensure express-session typings (and our augmentation) are loaded
import 'express-session';
import crypto from 'crypto';

// Compute secure cookie usage consistently with index.ts
const INSECURE = process.env.FORCE_INSECURE_COOKIES === '1' || process.env.USE_SECURE === '0';
const secureCookies = !INSECURE && process.env.NODE_ENV === 'production';

interface XsrfOptions { secure: boolean; }

// XSRF token issuer middleware
export const xsrfTokenIssuer = (opts: XsrfOptions) => (req: Request, res: Response, next: NextFunction) => {
  const sess: any = req.session;
  if (!sess || !sess.userId) return next();
  if (!sess.csrfToken) {
    sess.csrfToken = crypto.randomBytes(16).toString('hex');
  }
  const token = sess.csrfToken;
  if (req.cookies?.['XSRF-TOKEN'] !== token) {
    res.cookie('XSRF-TOKEN', token, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      secure: opts.secure && secureCookies // opts.secure already passed computed value; ensure consistency
    });
  }
  next();
};

interface CsrfProtectorOptions { exemptPaths?: string[]; }

// CSRF protection middleware
export const csrfProtector = (options: CsrfProtectorOptions = {}) => {
  const exempt = new Set(options.exemptPaths || []);
  return (req: Request, res: Response, next: NextFunction) => {
    if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
    if (exempt.has(req.path)) return next();
  const sess: any = req.session;
  if (!sess) return res.status(500).json({ error: 'Session not initialized' });
  const sessionToken = sess.csrfToken;
    const provided = (req.headers['x-xsrf-token'] as string) || req.body?._csrf || req.body?.csrfToken || (req.query?._csrf as string);
    if (!sessionToken || !provided || sessionToken !== provided) {
      return res.status(403).json({ error: 'Invalid or missing CSRF token' });
    }
    next();
  };
};
