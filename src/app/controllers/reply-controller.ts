import { FastifyRequest, FastifyReply } from 'fastify';
import { ReplyService } from '../../services/reply/index.js';

export const ReplyController = {
  async recommendReply(request: FastifyRequest, reply: FastifyReply) {
    const { leadId } = request.params as { leadId: string };

    if (!leadId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'leadId é um parâmetro obrigatório na URL',
      });
    }

    try {
      const recommendationContext = await ReplyService.getRecommendationContext(leadId);

      return reply.status(200).send(recommendationContext);
    } catch (err: any) {
      request.log.error(err, 'Erro ao compilar contexto de Suggested Reply');

      if (err.message.includes('não foi encontrado')) {
        return reply.status(404).send({
          error: 'Not Found',
          message: err.message,
        });
      }

      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Ocorreu um erro ao buscar recomendações de resposta para o lead',
      });
    }
  },
};
