import { FastifyRequest, FastifyReply } from 'fastify';
import { MemoryRepository } from '../../repositories/postgres/memory.js';

export const MemoryController = {
  async getMemory(request: FastifyRequest, reply: FastifyReply) {
    const { leadId } = request.params as { leadId: string };

    if (!leadId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'leadId é um parâmetro obrigatório',
      });
    }

    try {
      const memoryItems = await MemoryRepository.findByLeadId(leadId);
      
      // Separar as memórias por escopo de forma organizada para o consumidor
      const hotMemory = memoryItems.filter(item => item.memoryScope === 'hot');
      const profileMemory = memoryItems.filter(item => item.memoryScope === 'profile');
      const canonicalFacts = memoryItems.filter(item => item.memoryScope === 'canonical');
      const retractedMemory = memoryItems.filter(item => item.memoryScope === 'retracted');

      return reply.status(200).send({
        leadId,
        memory: {
          hot: hotMemory.map(item => ({ key: item.key, value: item.valueJson, confidence: item.confidence, status: item.status })),
          profile: profileMemory.map(item => ({ key: item.key, value: item.valueJson, confidence: item.confidence, status: item.status })),
          canonical: canonicalFacts.map(item => ({ key: item.key, value: item.valueJson, confidence: item.confidence, status: item.status })),
          retracted: retractedMemory.map(item => ({ key: item.key, value: item.valueJson, confidence: item.confidence, status: item.status })),
        },
        rawCount: memoryItems.length,
      });
    } catch (err: any) {
      request.log.error(err, 'Erro ao buscar memória do lead');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Ocorreu um erro ao recuperar os itens de memória do lead',
      });
    }
  },
};
