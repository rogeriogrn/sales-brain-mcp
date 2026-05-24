import { FastifyRequest, FastifyReply } from 'fastify';
import { PersonaRepository } from '../../repositories/postgres/persona.js';

export const PersonaController = {
  async getLatestPersona(request: FastifyRequest, reply: FastifyReply) {
    const { leadId } = request.params as { leadId: string };

    if (!leadId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'leadId é um parâmetro obrigatório',
      });
    }

    try {
      const latestSnapshot = await PersonaRepository.findLatestByLeadId(leadId);

      if (!latestSnapshot) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Nenhum snapshot de Persona comercial foi encontrado para este Lead',
        });
      }

      return reply.status(200).send({
        leadId,
        version: latestSnapshot.version,
        persona: latestSnapshot.personaJson,
        createdAt: latestSnapshot.createdAt,
        generatedFromTurnId: latestSnapshot.generatedFromTurnId,
      });
    } catch (err: any) {
      request.log.error(err, 'Erro ao buscar persona do lead');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Ocorreu um erro ao recuperar o snapshot de Persona do lead',
      });
    }
  },
};
