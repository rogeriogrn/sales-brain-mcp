import { FastifyInstance } from 'fastify';
import { TurnController } from '../controllers/turn-controller.js';
import { authenticateApiKey } from '../middleware/auth.js';

export async function turnRoutes(fastify: FastifyInstance) {
  // Rota de Ingestão Protegida por API Key
  fastify.post('/v1/turns/ingest', {
    onRequest: [authenticateApiKey],
  }, TurnController.ingest);
}
