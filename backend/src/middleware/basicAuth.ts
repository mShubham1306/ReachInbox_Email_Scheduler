import { Request, Response, NextFunction } from 'express';

export function basicAuth(user: string, password: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const base64 = authHeader.slice('Basic '.length);
    const [u, p] = Buffer.from(base64, 'base64').toString().split(':');
    if (u === user && p === password) {
      next();
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="Bull Board"');
      res.status(401).json({ error: 'Invalid credentials' });
    }
  };
}
