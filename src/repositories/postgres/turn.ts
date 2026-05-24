import { prisma } from './client.js';

export interface CreateTurnInput {
  conversationId: string;
  turnId: string;
  role: string;
  content: string;
  contentType?: string;
  metadataJson?: any;
  eventAt?: Date;
}

export const TurnRepository = {
  async findByTurnId(turnId: string) {
    return prisma.turn.findUnique({
      where: { turnId },
    });
  },

  async create(data: CreateTurnInput) {
    return prisma.turn.create({
      data: {
        conversationId: data.conversationId,
        turnId: data.turnId,
        role: data.role,
        content: data.content,
        contentType: data.contentType || 'text',
        metadataJson: data.metadataJson ? JSON.stringify(data.metadataJson) : null,
        eventAt: data.eventAt || new Date(),
      },
    });
  },

  async findRecentByLeadId(leadId: string, limit = 10) {
    const turns = await prisma.turn.findMany({
      where: {
        conversation: {
          leadId: leadId,
        },
      },
      orderBy: {
        eventAt: 'desc',
      },
      take: limit,
    });

    // Retorna os turnos ordenados cronologicamente (do mais antigo para o mais recente)
    return turns.reverse();
  },
};

