import { PrismaClient, EmailStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { addEmailJob } from '../queues/emailQueue';
import { campaignService, CreateCampaignInput } from './CampaignService';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface ScheduleEmailsInput {
  userId: string;
  senderId: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: Date;
  delayMs: number;
  hourlyLimit: number;
}

export interface ScheduleEmailsResult {
  campaignId: string;
  totalEmails: number;
  scheduledEmails: number;
  firstScheduledAt: Date;
  lastScheduledAt: Date;
}

export class EmailSchedulingService {
  async scheduleEmails(input: ScheduleEmailsInput): Promise<ScheduleEmailsResult> {
    const { userId, senderId, subject, body, recipients, startTime, delayMs, hourlyLimit } = input;

    // 1. Create campaign record
    const campaign = await campaignService.create({
      userId,
      senderId,
      subject,
      body,
      startTime,
      delayMs,
      hourlyLimit,
    } as CreateCampaignInput);

    // 2. Build all email records with staggered scheduled times
    const emailRecords: {
      id: string;
      campaignId: string;
      senderId: string;
      recipient: string;
      subject: string;
      body: string;
      scheduledAt: Date;
      status: EmailStatus;
      idempotencyKey: string;
    }[] = [];

    let scheduledAt = new Date(startTime);
    for (const recipient of recipients) {
      emailRecords.push({
        id: uuidv4(),
        campaignId: campaign.id,
        senderId,
        recipient,
        subject,
        body,
        scheduledAt: new Date(scheduledAt),
        status: EmailStatus.SCHEDULED,
        idempotencyKey: `${campaign.id}:${recipient}`,
      });
      scheduledAt = new Date(scheduledAt.getTime() + delayMs);
    }

    // 3. Bulk insert — skipDuplicates guards against re-submission
    await prisma.email.createMany({
      data: emailRecords,
      skipDuplicates: true,
    });

    logger.info(
      { campaignId: campaign.id, count: emailRecords.length },
      'Email records created in DB',
    );

    // 4. Enqueue BullMQ delayed jobs for each email
    let enqueuedCount = 0;
    for (const record of emailRecords) {
      try {
        const job = await addEmailJob(record.id, record.scheduledAt, {
          campaignId: campaign.id,
          senderId,
        });

        // Record the BullMQ job ID back in the DB for traceability
        await prisma.email.update({
          where: { id: record.id },
          data: { bullJobId: job.id ?? record.id },
        });

        enqueuedCount++;
      } catch (err) {
        logger.error({ err, emailId: record.id }, 'Failed to enqueue email job');
      }
    }

    logger.info(
      { campaignId: campaign.id, total: emailRecords.length, enqueued: enqueuedCount },
      'Campaign scheduled successfully',
    );

    return {
      campaignId: campaign.id,
      totalEmails: emailRecords.length,
      scheduledEmails: enqueuedCount,
      firstScheduledAt: emailRecords[0].scheduledAt,
      lastScheduledAt: emailRecords[emailRecords.length - 1].scheduledAt,
    };
  }

  async getScheduledEmails(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const whereClause = {
      campaign: { userId },
      status: { in: [EmailStatus.SCHEDULED, EmailStatus.PROCESSING, EmailStatus.RATE_LIMITED] },
    };
    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where: whereClause,
        include: {
          sender: { select: { email: true } },
          campaign: { select: { subject: true, id: true } },
        },
        orderBy: { scheduledAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.email.count({ where: whereClause }),
    ]);
    return { emails, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getSentEmails(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const whereClause = {
      campaign: { userId },
      status: { in: [EmailStatus.SENT, EmailStatus.FAILED] },
    };
    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where: whereClause,
        include: {
          sender: { select: { email: true } },
          campaign: { select: { subject: true, id: true } },
        },
        orderBy: { sentAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.email.count({ where: whereClause }),
    ]);
    return { emails, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async getEmailById(emailId: string, userId: string) {
    return prisma.email.findFirst({
      where: { id: emailId, campaign: { userId } },
      include: { sender: true, campaign: true },
    });
  }
}

export const emailSchedulingService = new EmailSchedulingService();
