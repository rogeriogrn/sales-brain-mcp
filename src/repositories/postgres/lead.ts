import { prisma } from './client.js';

export interface CreateLeadInput {
  externalId: string;
  name: string;
  phone?: string;
  email?: string;
  source?: string;
}

export const LeadRepository = {
  async findByExternalId(externalId: string) {
    return prisma.lead.findUnique({
      where: { externalId },
    });
  },

  async findById(id: string) {
    return prisma.lead.findUnique({
      where: { id },
    });
  },

  async create(data: CreateLeadInput) {
    return prisma.lead.create({
      data: {
        externalId: data.externalId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        source: data.source,
      },
    });
  },

  async findAll() {
    return prisma.lead.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
    });
  },
};

