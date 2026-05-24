import { prisma } from './client.js';

export const PersonaRepository = {
  async createSnapshot(leadId: string, version: number, personaJson: any, turnId?: string) {
    const created = await prisma.personaSnapshot.create({
      data: {
        leadId,
        version,
        personaJson: JSON.stringify(personaJson),
        generatedFromTurnId: turnId,
      },
    });

    return {
      ...created,
      personaJson: JSON.parse(created.personaJson),
    };
  },

  async findLatestByLeadId(leadId: string) {
    const latest = await prisma.personaSnapshot.findFirst({
      where: { leadId },
      orderBy: { version: 'desc' },
    });

    if (!latest) return null;

    return {
      ...latest,
      personaJson: JSON.parse(latest.personaJson),
    };
  },

  async getVersionCount(leadId: string): Promise<number> {
    return prisma.personaSnapshot.count({
      where: { leadId },
    });
  },
};
