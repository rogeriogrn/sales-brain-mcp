import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { TurnIngestionService } from '../../services/turn-ingestion/index.js';

const ingestSchema = z.object({
  turnId: z.string().min(1, 'turnId é obrigatório'),
  leadExternalId: z.string().min(1, 'leadExternalId é obrigatório'),
  leadName: z.string().min(1, 'leadName é obrigatório'),
  conversationExternalId: z.string().min(1, 'conversationExternalId é obrigatório'),
  role: z.enum(['user', 'assistant', 'operator', 'system']),
  content: z.string().min(1, 'content é obrigatório'),
  contentType: z.string().optional(),
  timestamp: z.string().optional(), // flexível para aceitar ISOs variadas
  metadata: z.record(z.any()).optional(),
});

export const TurnController = {
  async ingest(request: FastifyRequest, reply: FastifyReply) {
    const parseResult = ingestSchema.safeParse(request.body);

    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Falha na validação do payload de ingestão',
        details: parseResult.error.format(),
      });
    }

    try {
      const result = await TurnIngestionService.ingest(parseResult.data);
      const statusCode = result.isDuplicate ? 200 : 201;
      return reply.status(statusCode).send(result);
    } catch (err: any) {
      request.log.error(err, 'Erro no controller de ingestão de turnos');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Ocorreu um erro ao ingerir o turno de conversa',
      });
    }
  },
};
