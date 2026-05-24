import { FastifyInstance } from 'fastify';
import { prisma } from '../../repositories/postgres/client.js';
import { redis } from '../../repositories/redis/client.js';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request, reply) => {
    let postgresStatus = 'OK';
    let redisStatus = 'OK';

    try {
      // Executa query simples para testar conexão Postgres
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      postgresStatus = 'DOWN';
    }

    try {
      // Pinga o Redis para atestar conectividade
      await redis.ping();
    } catch (err) {
      redisStatus = 'DOWN';
    }

    const isHealthy = postgresStatus === 'OK' && redisStatus === 'OK';
    const status = isHealthy ? 'healthy' : 'degraded';

    return reply.status(isHealthy ? 200 : 503).send({
      status,
      services: {
        postgres: postgresStatus,
        redis: redisStatus,
      },
      timestamp: new Date().toISOString(),
    });
  });
}
