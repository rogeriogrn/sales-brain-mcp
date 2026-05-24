import { FastifyRequest, FastifyReply } from 'fastify';
import { LeadRepository } from '../../repositories/postgres/lead.js';

export const LeadController = {
  async listLeads(request: FastifyRequest, reply: FastifyReply) {
    try {
      const leads = await LeadRepository.findAll();
      return reply.status(200).send(leads);
    } catch (err: any) {
      request.log.error(err, 'Erro ao listar leads no controller');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Ocorreu um erro ao recuperar a listagem de leads',
      });
    }
  },
};
