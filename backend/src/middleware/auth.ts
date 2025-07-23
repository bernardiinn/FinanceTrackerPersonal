import { Request, Response, NextFunction } from 'express';

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
  if (!req.session.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  // Add user information to request object for easy access
  req.userId = req.session.userId;
  req.user = req.session.user;
  
  next();
};

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  // Set user information if available, but don't require it
  if (req.session.userId) {
    req.userId = req.session.userId;
    req.user = req.session.user;
  }
  
  next();
};
