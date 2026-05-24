import { prisma } from './client.js';

export interface CreateSignalInput {
  leadId: string;
  turnId: string;
  signalType: string;
  signalValue: string;
  score: number;
  evidenceJson?: any;
}

export const SignalRepository = {
  async create(data: CreateSignalInput) {
    const created = await prisma.signal.create({
      data: {
        leadId: data.leadId,
        turnId: data.turnId,
        signalType: data.signalType,
        signalValue: data.signalValue,
        score: data.score,
        evidenceJson: data.evidenceJson ? JSON.stringify(data.evidenceJson) : null,
      },
    });

    return {
      ...created,
      evidenceJson: created.evidenceJson ? JSON.parse(created.evidenceJson) : null,
    };
  },

  async findByLeadId(leadId: string) {
    const signals = await prisma.signal.findMany({
      where: { leadId },
    });

    return signals.map(sig => ({
      ...sig,
      evidenceJson: sig.evidenceJson ? JSON.parse(sig.evidenceJson) : null,
    }));
  },
};
