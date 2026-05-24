import { prisma } from './client.js';

export const StrategyRepository = {
  async createSnapshot(leadId: string, version: number, stage: string, strategyJson: any, turnId?: string) {
    const created = await prisma.strategySnapshot.create({
      data: {
        leadId,
        version,
        stage,
        strategyJson: JSON.stringify(strategyJson),
        generatedFromTurnId: turnId,
      },
    });

    return {
      ...created,
      strategyJson: JSON.parse(created.strategyJson),
    };
  },

  async findLatestByLeadId(leadId: string) {
    const latest = await prisma.strategySnapshot.findFirst({
      where: { leadId },
      orderBy: { version: 'desc' },
    });

    if (!latest) return null;

    return {
      ...latest,
      strategyJson: JSON.parse(latest.strategyJson),
    };
  },

  async getVersionCount(leadId: string): Promise<number> {
    return prisma.strategySnapshot.count({
      where: { leadId },
    });
  },
};
