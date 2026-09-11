import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { WebClient } from '@slack/web-api';
import config from '../config';
import { getSlackAuthUrl } from '../integrations/slack/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export class SlackController {
  // GET /auth/slack
  connect = async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) {
      return res.redirect(`${config.frontendUrl}/login?error=unauthorized`);
    }

    if (!config.slack.clientId || !config.slack.clientSecret) {
      if (config.nodeEnv !== 'production') {
        try {
          await prisma.slackConnection.upsert({
            where: { userId: user.id },
            update: {
              teamId: 'T0123456789',
              teamName: 'ReachInbox Workspace',
              accessToken: 'xoxb-mock-slack-token',
              connected: true,
            },
            create: {
              userId: user.id,
              teamId: 'T0123456789',
              teamName: 'ReachInbox Workspace',
              accessToken: 'xoxb-mock-slack-token',
              connected: true,
            },
          });
        } catch {
          if (req.session) {
            (req.session as any).mockSlackConnected = true;
          }
        }
        return res.redirect(`${config.frontendUrl}/dashboard?slack=connected`);
      }

      return res.status(400).json({
        success: false,
        error: 'Slack OAuth is not configured. Set SLACK_CLIENT_ID and SLACK_CLIENT_SECRET in .env',
      });
    }

    // State carries userId for security and linking
    const state = Buffer.from(JSON.stringify({ userId: user.id })).toString('base64');
    const authUrl = getSlackAuthUrl(state);
    return res.redirect(authUrl);
  };

  // GET /auth/slack/callback
  callback = async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    if (error) {
      logger.warn({ error }, 'Slack OAuth access denied or error');
      return res.redirect(`${config.frontendUrl}/dashboard?slack=error`);
    }

    if (!code || !state) {
      return res.redirect(`${config.frontendUrl}/dashboard?slack=missing_params`);
    }

    try {
      const { userId } = JSON.parse(Buffer.from(state as string, 'base64').toString('utf-8'));

      const client = new WebClient();
      const oauthResult = await client.oauth.v2.access({
        client_id: config.slack.clientId,
        client_secret: config.slack.clientSecret,
        code: code as string,
        redirect_uri: config.slack.redirectUri,
      });

      if (!oauthResult.ok || !oauthResult.access_token) {
        throw new Error(oauthResult.error || 'Failed to exchange Slack OAuth code');
      }

      const teamId = oauthResult.team?.id || 'default-team';
      const teamName = oauthResult.team?.name || 'Slack Workspace';
      const botUserId = oauthResult.bot_user_id || undefined;
      const accessToken = oauthResult.access_token;

      // Upsert connection
      await prisma.slackConnection.upsert({
        where: { userId },
        update: {
          teamId,
          teamName,
          botUserId,
          accessToken,
          connected: true,
        },
        create: {
          userId,
          teamId,
          teamName,
          botUserId,
          accessToken,
          connected: true,
        },
      });

      logger.info({ userId, teamName }, 'Slack connected successfully via OAuth');
      return res.redirect(`${config.frontendUrl}/dashboard?slack=connected`);
    } catch (err: any) {
      logger.error({ err }, 'Slack OAuth callback failed');
      return res.redirect(`${config.frontendUrl}/dashboard?slack=failed`);
    }
  };

  // GET /api/slack/status
  getStatus = async (req: Request, res: Response) => {
    const user = req.user as any;
    if (!user) {
      return res.json({ success: true, data: { connected: false } });
    }

    if (req.session && (req.session as any).mockSlackConnected) {
      return res.json({
        success: true,
        data: {
          connected: true,
          teamName: 'ReachInbox Workspace',
        },
      });
    }

    try {
      const connection = await prisma.slackConnection.findUnique({
        where: { userId: user.id },
        select: {
          connected: true,
          teamName: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.json({
        success: true,
        data: connection || { connected: false },
      });
    } catch {
      return res.json({
        success: true,
        data: { connected: false },
      });
    }
  };

  // POST /api/slack/disconnect
  disconnect = async (req: Request, res: Response) => {
    const user = req.user as any;
    if (req.session) {
      (req.session as any).mockSlackConnected = false;
    }

    try {
      if (user?.id) {
        await prisma.slackConnection.updateMany({
          where: { userId: user.id },
          data: { connected: false },
        });
      }
    } catch {
      // ignore
    }

    logger.info({ userId: user?.id }, 'Slack disconnected');
    return res.json({
      success: true,
      message: 'Slack disconnected successfully',
    });
  };
}

export const slackController = new SlackController();
