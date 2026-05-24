import { FastifyInstance } from "fastify";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { mcpServer } from "../../services/mcp-core.js";
import { logger } from "../../shared/logger/index.js";
import { authenticateApiKey } from "../middleware/auth.js";

export async function mcpRoutes(fastify: FastifyInstance) {
  let transport: SSEServerTransport | null = null;

  // 1. Canal de Stream de Eventos (SSE) do MCP
  fastify.get('/v1/mcp/sse', {
    onRequest: [authenticateApiKey],
  }, async (request, reply) => {
    logger.info('🔌 Cliente estabelecendo conexão SSE do MCP');

    // SSEServerTransport espera o path onde as mensagens POST devem ser enviadas e a resposta http crua
    transport = new SSEServerTransport('/v1/mcp/messages', reply.raw);

    // Conecta o servidor MCP ao transporte SSE
    await mcpServer.connect(transport);

    // Gerenciar o encerramento da conexão
    request.raw.on('close', async () => {
      logger.info('🔌 Conexão SSE do MCP fechada pelo cliente');
      // Fecha e limpa o servidor MCP para liberar recursos
      await mcpServer.close();
      transport = null;
    });
  });

  // 2. Canal de recebimento de comandos do cliente (JSON-RPC via POST)
  fastify.post('/v1/mcp/messages', {
    onRequest: [authenticateApiKey],
  }, async (request, reply) => {
    if (!transport) {
      logger.warn('⚠️ Requisição POST de mensagens recebida sem sessão SSE ativa');
      return reply.status(400).send({ 
        error: 'Bad Request', 
        message: 'A sessão SSE não foi estabelecida. Conecte no GET /v1/mcp/sse primeiro.' 
      });
    }

    try {
      const message = typeof request.body === 'string' 
        ? JSON.parse(request.body) 
        : request.body;

      // Executa a mensagem no transporte
      await transport.handleMessage(message);
      
      // Resposta padrão HTTP 200 OK para aceitar a mensagem JSON-RPC
      return reply.status(200).send('OK');
    } catch (err: any) {
      logger.error(err, '❌ Erro ao lidar com mensagem no transporte SSE do MCP');
      return reply.status(500).send({ 
        error: 'Internal Server Error', 
        message: err.message 
      });
    }
  });
}
