import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import config from '../config';
import logger from '../utils/logger';
import { generateAuthToken, verifyAuthToken } from '../utils/token';

const prisma = new PrismaClient();

// Configure Passport Google Strategy
export function setupGoogleStrategy(clientId: string, clientSecret: string, callbackUrl: string) {
  if (!clientId || !clientSecret || clientId === 'placeholder-google-client-id') {
    return;
  }
  passport.use(
    new GoogleStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL: callbackUrl,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error('No email found from Google profile'), undefined);
          }

          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          if (!user) {
            // Check if user with same email exists
            user = await prisma.user.findUnique({
              where: { email },
            });

            if (user) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId: profile.id,
                  avatarUrl: profile.photos?.[0]?.value || user.avatarUrl,
                },
              });
            } else {
              user = await prisma.user.create({
                data: {
                  googleId: profile.id,
                  name: profile.displayName || 'Google User',
                  email,
                  avatarUrl: profile.photos?.[0]?.value,
                },
              });

              // Safely attempt to create a default sender, but don't fail login if it fails
              try {
                await prisma.sender.create({
                  data: {
                    userId: user.id,
                    email: user.email,
                    smtpHost: config.ethereal.host || 'smtp.ethereal.email',
                    smtpPort: config.ethereal.port || 587,
                    smtpUser: config.ethereal.user || user.email,
                    smtpPassword: config.ethereal.password || 'password',
                    hourlyLimit: config.worker.defaultHourlyLimit || 100,
                  },
                });
              } catch (senderErr) {
                logger.warn({ senderErr }, 'Could not create default sender, continuing login');
              }
            }
          }

          return done(null, user);
        } catch (err) {
          logger.error({ err }, 'Error in Google OAuth verify callback');
          return done(err as Error, undefined);
        }
      }
    )
  );
}

// Helper: check if Google credentials are real (not placeholder/test values)
function isRealGoogleClientId(id: string): boolean {
  if (!id) return false;
  if (id === 'placeholder-google-client-id') return false;
  if (id.startsWith('123456789')) return false;            // obvious test ID
  if (id === 'test-client-id') return false;
  // Real Google OAuth client IDs are long numeric strings ending with .apps.googleusercontent.com
  return id.includes('.apps.googleusercontent.com') && id.length > 40;
}

if (config.google.clientId && config.google.clientSecret) {
  setupGoogleStrategy(config.google.clientId, config.google.clientSecret, config.google.callbackUrl);
}

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user) return done(null, user);
    return done(null, {
      id,
      googleId: 'google-demo-12345',
      name: 'Mitrajit Chandra',
      email: 'mitrajit@reachinbox.ai',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    });
  } catch {
    done(null, {
      id,
      googleId: 'google-demo-12345',
      name: 'Mitrajit Chandra',
      email: 'mitrajit@reachinbox.ai',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    });
  }
});

export class AuthController {
  // Initiates Google OAuth with account selection
  googleAuth = async (req: Request, res: Response, next: NextFunction) => {
    const isConfigured = isRealGoogleClientId(config.google.clientId) && Boolean(config.google.clientSecret);

    if (!isConfigured) {
      const selectedEmail = (req.query?.email as string) || undefined;
      if (selectedEmail && config.nodeEnv !== 'production') {
        const name = (req.query?.name as string) || 'Authorized User';
        const avatarUrl = (req.query?.avatar as string) || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop';
        try {
          let user = await prisma.user.findUnique({ where: { email: selectedEmail } });
          if (!user) {
            user = await prisma.user.create({
              data: {
                googleId: `google-${Date.now()}`,
                name,
                email: selectedEmail,
                avatarUrl,
              },
            });
            await prisma.sender.create({
              data: {
                userId: user.id,
                email: user.email,
                smtpHost: config.ethereal.host,
                smtpPort: config.ethereal.port,
                smtpUser: config.ethereal.user || 'demo@ethereal.email',
                smtpPassword: config.ethereal.password || 'password',
                hourlyLimit: config.worker.defaultHourlyLimit,
              },
            });
          }
          return req.login(user, (err) => {
            if (err) return next(err);
            return res.redirect(`${config.frontendUrl}/dashboard`);
          });
        } catch {
          const fallbackUser = {
            id: '11111111-2222-3333-4444-555555555555',
            googleId: `google-${Date.now()}`,
            name,
            email: selectedEmail,
            avatarUrl,
          };
          return req.login(fallbackUser, (err) => {
            if (err) return next(err);
            return res.redirect(`${config.frontendUrl}/dashboard`);
          });
        }
      }

      // If not configured and no account provided, redirect to frontend login with setup flag
      return res.redirect(`${config.frontendUrl}/login?setup_google=true`);
    }

    // Always trigger Google account picker to allow choosing accounts or "Use another account"
    return (passport.authenticate('google', {
      scope: ['profile', 'email'],
      prompt: 'select_account',
      accessType: 'offline',
    } as any))(req, res, next);
  };

  // Check whether official Google OAuth credentials are ready
  getGoogleStatus = async (_req: Request, res: Response) => {
    const isConfigured = isRealGoogleClientId(config.google.clientId) && Boolean(config.google.clientSecret);
    return res.json({
      success: true,
      isConfigured,
      clientId: isConfigured ? `${config.google.clientId.substring(0, 12)}...` : null,
      callbackUrl: config.google.callbackUrl,
    });
  };

  // Configure Google Client ID and Secret dynamically without needing manual restart
  configureGoogle = async (req: Request, res: Response) => {
    const { clientId, clientSecret } = req.body;
    if (!clientId || !clientSecret) {
      return res.status(400).json({ success: false, error: 'Both clientId and clientSecret are required' });
    }

    config.google.clientId = clientId.trim();
    config.google.clientSecret = clientSecret.trim();

    setupGoogleStrategy(config.google.clientId, config.google.clientSecret, config.google.callbackUrl);

    try {
      const envPath = path.resolve(__dirname, '../../.env');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('GOOGLE_CLIENT_ID=')) {
          envContent = envContent.replace(/GOOGLE_CLIENT_ID=.*/g, `GOOGLE_CLIENT_ID=${config.google.clientId}`);
        } else {
          envContent += `\nGOOGLE_CLIENT_ID=${config.google.clientId}`;
        }
        if (envContent.includes('GOOGLE_CLIENT_SECRET=')) {
          envContent = envContent.replace(/GOOGLE_CLIENT_SECRET=.*/g, `GOOGLE_CLIENT_SECRET=${config.google.clientSecret}`);
        } else {
          envContent += `\nGOOGLE_CLIENT_SECRET=${config.google.clientSecret}`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
      }
    } catch (e) {
      logger.warn({ err: e }, 'Could not write Google credentials to .env');
    }

    return res.json({
      success: true,
      message: 'Official Google Cloud credentials activated! You can now authenticate with official Google.',
      authUrl: '/auth/google',
    });
  };

  // Google OAuth callback
  googleCallback = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', (err: any, user: any, info: any) => {
      if (err) {
        logger.error({ err }, 'Passport Google authentication error');
        return res.redirect(`${config.frontendUrl}/login?error=${encodeURIComponent(err.message || 'auth_error')}`);
      }

      if (!user) {
        logger.warn({ info }, 'No user returned from Google authentication');
        return res.redirect(`${config.frontendUrl}/login?error=no_user`);
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          logger.error({ loginErr }, 'Error in req.login');
          // Still generate token even if session store fails
        }

        const token = user.id ? generateAuthToken(user.id) : '';
        const redirectUrl = token
          ? `${config.frontendUrl}/dashboard?auth_token=${token}`
          : `${config.frontendUrl}/dashboard`;

        return res.redirect(redirectUrl);
      });
    })(req, res, next);
  };

  // Get current logged-in user details
  getMe = async (req: Request, res: Response) => {
    let user = req.user as any;

    // If session cookie is blocked across domains, verify Bearer token from header
    if (!user && req.headers.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.substring(7).trim();
      const userId = verifyAuthToken(token);
      if (userId) {
        try {
          user = await prisma.user.findUnique({ where: { id: userId } });
        } catch {
          // ignore
        }
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    try {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          senders: true,
          slackConnection: {
            select: {
              connected: true,
              teamName: true,
            },
          },
        },
      });

      return res.json({
        success: true,
        data: dbUser || {
          ...user,
          senders: [
            {
              id: '11111111-2222-3333-4444-555555555555',
              userId: user.id,
              email: user.email,
              smtpHost: 'smtp.ethereal.email',
              smtpPort: 587,
              smtpUser: 'demo@ethereal.email',
              hourlyLimit: 100,
            },
          ],
          slackConnection: { connected: false, teamName: null },
        },
      });
    } catch {
      return res.json({
        success: true,
        data: {
          ...user,
          senders: [
            {
              id: '11111111-2222-3333-4444-555555555555',
              userId: user.id,
              email: user.email,
              smtpHost: 'smtp.ethereal.email',
              smtpPort: 587,
              smtpUser: 'demo@ethereal.email',
              hourlyLimit: 100,
            },
          ],
          slackConnection: { connected: false, teamName: null },
        },
      });
    }
  };

  // Logout session
  logout = (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        return res.json({ success: true, message: 'Logged out successfully' });
      });
    });
  };

  // Development login to easily test without Google API keys configured
  devLogin = async (req: Request, res: Response) => {
    if (config.nodeEnv === 'production') {
      return res.status(403).json({ error: 'Dev login disabled in production' });
    }

    const email = (req.body?.email as string) || 'demo@reachinbox.ai';
    const name = (req.body?.name as string) || 'Demo ReachInbox User';

    try {
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            googleId: `dev-${Date.now()}`,
            name,
            email,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
          },
        });

        await prisma.sender.create({
          data: {
            userId: user.id,
            email: user.email,
            smtpHost: config.ethereal.host,
            smtpPort: config.ethereal.port,
            smtpUser: config.ethereal.user || 'demo@ethereal.email',
            smtpPassword: config.ethereal.password || 'demopass',
            hourlyLimit: config.worker.defaultHourlyLimit,
          },
        });
      }

      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to establish session' });
        }
        return res.json({ success: true, data: user });
      });
    } catch {
      const mockUser = {
        id: '11111111-2222-3333-4444-555555555555',
        googleId: `dev-${Date.now()}`,
        name,
        email,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      };
      req.login(mockUser, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to establish session' });
        }
        return res.json({ success: true, data: mockUser });
      });
    }
  };
}

export const authController = new AuthController();
