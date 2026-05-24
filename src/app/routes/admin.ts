import { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/admin-controller.js';
import { authenticateApiKey } from '../middleware/auth.js';

export async function adminRoutes(fastify: FastifyInstance) {
  // Rota administrativa para buscar KPIs do dashboard
  fastify.get('/v1/admin/stats', {
    onRequest: [authenticateApiKey],
  }, AdminController.getStats);

  // Rota administrativa para buscar logs de auditoria reais do lead
  fastify.get('/v1/leads/:leadId/audit', {
    onRequest: [authenticateApiKey],
  }, AdminController.getAuditByLead);
}
