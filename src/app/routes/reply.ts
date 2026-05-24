import { FastifyInstance } from 'fastify';
import { ReplyController } from '../controllers/reply-controller.js';
import { authenticateApiKey } from '../middleware/auth.js';

export async function replyRoutes(fastify: FastifyInstance) {
  // Rota Protegida de Consulta de Sugestão de Resposta (Suggested Reply Context)
  fastify.get('/v1/leads/:leadId/reply/recommend', {
    onRequest: [authenticateApiKey],
  }, ReplyController.recommendReply);
}
