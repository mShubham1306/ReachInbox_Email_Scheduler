import { PrismaClient, Campaign, CampaignStatus } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateCampaignInput {
  userId: string;
  senderId: string;
  subject: string;
  body: string;
  startTime: Date;
  delayMs: number;
  hourlyLimit: number;
}

export class CampaignService {
  async create(input: CreateCampaignInput): Promise<Campaign> {
    const campaign = await prisma.campaign.create({
      data: {
        userId: input.userId,
        senderId: input.senderId,
        subject: input.subject,
        body: input.body,
        startTime: input.startTime,
        delayMs: input.delayMs,
        hourlyLimit: input.hourlyLimit,
        status: CampaignStatus.ACTIVE,
      },
    });
    logger.info({ campaignId: campaign.id, userId: input.userId }, 'Campaign created');
    return campaign;
  }

  async findByUser(userId: string) {
    return prisma.campaign.findMany({
      where: { userId },
      include: {
        _count: { select: { emails: true } },
        sender: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.campaign.findFirst({
      where: { id, userId },
      include: { sender: true, _count: { select: { emails: true } } },
    });
  }

  async updateStatus(id: string, status: CampaignStatus): Promise<void> {
    await prisma.campaign.update({ where: { id }, data: { status } });
  }
}

export const campaignService = new CampaignService();
