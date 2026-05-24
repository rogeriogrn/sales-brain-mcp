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
};
