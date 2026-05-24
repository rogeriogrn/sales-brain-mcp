import { FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../shared/config/index.js';

export async function authenticateApiKey(request: FastifyRequest, reply: FastifyReply) {
  const query = request.query as Record<string, string> | undefined;
  const apiKey = request.headers['x-api-key'] || query?.['apiKey'] || query?.['x-api-key'];

  if (!apiKey || apiKey !== config.API_KEY) {
    reply.status(401).send({
      error: 'Unauthorized',
      message: 'API Key inválida ou ausente no cabeçalho X-API-Key ou parâmetro de query.',
    });
    return reply; // interrompe a execução no Fastify
  }
}
