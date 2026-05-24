import { FastifyInstance } from 'fastify';
import { MemoryController } from '../controllers/memory-controller.js';
import { authenticateApiKey } from '../middleware/auth.js';

export async function memoryRoutes(fastify: FastifyInstance) {
  // Rota Protegida para Leitura de Memória
  fastify.get('/v1/leads/:leadId/memory', {
    onRequest: [authenticateApiKey],
  }, MemoryController.getMemory);
}
