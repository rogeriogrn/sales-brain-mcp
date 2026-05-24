import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../shared/config/index.js';
import { logger } from '../shared/logger/index.js';
import { redis } from '../repositories/redis/client.js';
import { healthRoutes } from './routes/health.js';
import { turnRoutes } from './routes/turns.js';
import { memoryRoutes } from './routes/memory.js';
import { personaRoutes } from './routes/persona.js';
import { strategyRoutes } from './routes/strategy.js';
import { mcpRoutes } from './routes/mcp.js';
import { replyRoutes } from './routes/reply.js';
import { leadRoutes } from './routes/leads.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, '../../public');

const fastify = Fastify({
  logger: logger,
});

async function main() {
  try {
    // Registrar CORS
    await fastify.register(cors, {
      origin: '*',
    });

    // Registrar Servidor de Arquivos Estáticos (Frontend SPA)
    await fastify.register(fastifyStatic, {
      root: publicPath,
      prefix: '/',
    });

    // Conectar ao Redis na inicialização da aplicação
    await redis.connect();

    // Registrar Rotas Públicas
    await fastify.register(healthRoutes);

    // Registrar Rotas de Ingestão de Turnos
    await fastify.register(turnRoutes);

    // Registrar Rotas de Memória
    await fastify.register(memoryRoutes);

    // Registrar Rotas de Persona
    await fastify.register(personaRoutes);

    // Registrar Rotas de Estratégia
    await fastify.register(strategyRoutes);

    // Registrar Rotas de MCP SSE
    await fastify.register(mcpRoutes);

    // Registrar Rotas de Sugestão de Respostas
    await fastify.register(replyRoutes);

    // Registrar Rotas de Leads
    await fastify.register(leadRoutes);

    // Iniciar o Servidor Fastify
    const address = await fastify.listen({
      port: config.PORT,
      host: '0.0.0.0',
    });

    logger.info(`🚀 Servidor Sales Brain iniciado com sucesso em ${address}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
export { fastify };
