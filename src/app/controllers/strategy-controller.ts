import { FastifyRequest, FastifyReply } from 'fastify';
import { StrategyRepository } from '../../repositories/postgres/strategy.js';

export const StrategyController = {
  async getLatestStrategy(request: FastifyRequest, reply: FastifyReply) {
    const { leadId } = request.params as { leadId: string };

    if (!leadId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'leadId é um parâmetro obrigatório',
      });
    }

    try {
      const latestSnapshot = await StrategyRepository.findLatestByLeadId(leadId);

      if (!latestSnapshot) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Nenhum snapshot de Estratégia Comercial foi encontrado para este Lead',
        });
      }

      return reply.status(200).send({
        leadId,
        version: latestSnapshot.version,
        stage: latestSnapshot.stage,
        strategy: latestSnapshot.strategyJson,
        createdAt: latestSnapshot.createdAt,
        generatedFromTurnId: latestSnapshot.generatedFromTurnId,
      });
    } catch (err: any) {
      request.log.error(err, 'Erro ao buscar estratégia comercial do lead');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Ocorreu um erro ao recuperar o snapshot de Estratégia do lead',
      });
    }
  },
};
