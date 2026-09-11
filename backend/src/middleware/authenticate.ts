import { Request, Response, NextFunction } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user: User;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated() && req.user) {
    return next();
  }
  res.status(401).json({ success: false, error: 'Authentication required' });
}
