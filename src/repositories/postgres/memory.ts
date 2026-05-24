import { prisma } from './client.js';

export interface UpsertMemoryItemInput {
  leadId: string;
  memoryScope: string;
  key: string;
  valueJson: any;
  confidence: number;
  status: string;
  sourceType: string;
  sourceRef?: string;
  expiresAt?: Date;
}

export const MemoryRepository = {
  async findByLeadId(leadId: string) {
    const items = await prisma.memoryItem.findMany({
      where: { leadId },
    });

    // Converter valores serializados de volta para objetos Javascript estruturados
    return items.map(item => ({
      ...item,
      valueJson: JSON.parse(item.valueJson),
    }));
  },

  async findSpecific(leadId: string, memoryScope: string, key: string) {
    const item = await prisma.memoryItem.findFirst({
      where: {
        leadId,
        memoryScope,
        key,
      },
    });

    if (!item) return null;

    return {
      ...item,
      valueJson: JSON.parse(item.valueJson),
    };
  },

  async upsert(data: UpsertMemoryItemInput) {
    const existing = await prisma.memoryItem.findFirst({
      where: {
        leadId: data.leadId,
        memoryScope: data.memoryScope,
        key: data.key,
      },
    });

    const serializedValue = JSON.stringify(data.valueJson);

    if (existing) {
      const updated = await prisma.memoryItem.update({
        where: { id: existing.id },
        data: {
          valueJson: serializedValue,
          confidence: data.confidence,
          status: data.status,
          sourceType: data.sourceType,
          sourceRef: data.sourceRef,
          expiresAt: data.expiresAt,
          lastSeenAt: new Date(),
        },
      });

      return {
        ...updated,
        valueJson: JSON.parse(updated.valueJson),
      };
    }

    const created = await prisma.memoryItem.create({
      data: {
        leadId: data.leadId,
        memoryScope: data.memoryScope,
        key: data.key,
        valueJson: serializedValue,
        confidence: data.confidence,
        status: data.status,
        sourceType: data.sourceType,
        sourceRef: data.sourceRef,
        expiresAt: data.expiresAt,
        firstSeenAt: new Date(),
        lastSeenAt: new Date(),
      },
    });

    return {
      ...created,
      valueJson: JSON.parse(created.valueJson),
    };
  },
};
