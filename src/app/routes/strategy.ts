import { FastifyInstance } from 'fastify';
import { StrategyController } from '../controllers/strategy-controller.js';
import { authenticateApiKey } from '../middleware/auth.js';

export async function strategyRoutes(fastify: FastifyInstance) {
  // Rota Protegida de Consulta de Estratégia Comercial do Lead
  fastify.get('/v1/leads/:leadId/strategy', {
    onRequest: [authenticateApiKey],
  }, StrategyController.getLatestStrategy);
}
