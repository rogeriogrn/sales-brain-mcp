import { FastifyInstance } from 'fastify';
import { LeadController } from '../controllers/lead-controller.js';
import { authenticateApiKey } from '../middleware/auth.js';

export async function leadRoutes(fastify: FastifyInstance) {
  // Rota Protegida de Listagem de Leads do Sistema
  fastify.get('/v1/leads', {
    onRequest: [authenticateApiKey],
  }, LeadController.listLeads);
}
