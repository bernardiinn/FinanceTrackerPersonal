import { Request, Response, NextFunction } from 'express';
import 'express-session';

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      user?: {
        id: number;
        email: string;
        first_name?: string;
        last_name?: string;
      };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const sess: any = req.session; // fallback casting if augmentation not picked up yet
  if (!sess || !sess.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Add user information to request object for easy access
  req.userId = sess.userId;
  req.user = sess.user;
  
  next();
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const sess: any = req.session;
  if (sess && sess.userId) {
    req.userId = sess.userId;
    req.user = sess.user;
  }
  
  next();
};
