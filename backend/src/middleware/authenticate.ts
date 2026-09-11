import { Request, Response, NextFunction } from 'express';
import { User, PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '../utils/token';

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
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user) {
          req.user = user;
          return next();
        }
      } catch {
        // fall through to session check
      }
    }
  }

  // 2. Check traditional session / cookie
  if (req.isAuthenticated && req.isAuthenticated() && req.user) {
    return next();
  }

  res.status(401).json({ success: false, error: 'Authentication required' });
}
