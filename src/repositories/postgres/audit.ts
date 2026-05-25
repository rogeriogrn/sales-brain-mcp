import { prisma } from './client.js';

export interface CreateAuditEventInput {
  leadId: string;
  eventType: string;
  payloadJson?: any;
}

export const AuditRepository = {
  async create(data: CreateAuditEventInput) {
    return prisma.auditEvent.create({
      data: {
        leadId: data.leadId,
        eventType: data.eventType,
        payloadJson: data.payloadJson ? JSON.stringify(data.payloadJson) : null,
      },
    });
  },

  async createMany(data: CreateAuditEventInput[]) {
    return prisma.auditEvent.createMany({
      data: data.map(item => ({
        leadId: item.leadId,
        eventType: item.eventType,
        payloadJson: item.payloadJson ? JSON.stringify(item.payloadJson) : null,
      })),
    });
  },

  async findByLeadId(leadId: string, limit = 20) {
    return prisma.auditEvent.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },
};

