import { prisma } from './client.js';

export interface CreateConversationInput {
  leadId: string;
  channel: string;
  title?: string;
}

export const ConversationRepository = {
  // Para fins do MVP, podemos associar uma conversa ao lead usando um identificador único de canal/ID
  async findActiveByLeadId(leadId: string) {
    return prisma.conversation.findFirst({
      where: {
        leadId,
        endedAt: null,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  },

  async findById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
    });
  },

  async create(data: CreateConversationInput) {
    return prisma.conversation.create({
      data: {
        leadId: data.leadId,
        channel: data.channel,
        title: data.title,
      },
    });
  },
};
