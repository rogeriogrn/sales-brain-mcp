import { FastifyInstance } from 'fastify';
import { PersonaController } from '../controllers/persona-controller.js';
import { authenticateApiKey } from '../middleware/auth.js';

export async function personaRoutes(fastify: FastifyInstance) {
  // Rota Protegida de Consulta de Persona do Lead
  fastify.get('/v1/leads/:leadId/persona', {
    onRequest: [authenticateApiKey],
  }, PersonaController.getLatestPersona);
}
