import { Request, Response, NextFunction } from 'express';
import { User, PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '../utils/token';
import config from '../config';

const prisma = new PrismaClient();

export interface AuthenticatedRequest extends Request {
  user: User;
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // 1. Check Bearer Token in Authorization header (reliable across domains like Vercel <-> Render)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const userId = verifyAuthToken(token);
    if (userId) {
      // Try DB first; if DB unavailable, build a minimal user from token
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          req.user = user;
          return next();
        }
      } catch {
        // DB not available — allow in dev mode with a synthetic user
        if (config.isDevelopment) {
          req.user = { id: userId, googleId: `dev-${userId}`, name: 'Dev User', email: 'dev@reachinbox.ai', avatarUrl: null, createdAt: new Date(), updatedAt: new Date() } as any;
          return next();
        }
      }
    }
  }

  // 2. Check traditional session / cookie (set by dev-login or Google OAuth)
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }

  res.status(401).json({ success: false, error: 'Authentication required' });
}

