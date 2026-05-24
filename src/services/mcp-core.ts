import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TurnIngestionService } from "./turn-ingestion/index.js";
import { ReplyService } from "./reply/index.js";
import { logger } from "../shared/logger/index.js";

// Inicializa a instância centralizada do servidor MCP
export const mcpServer = new Server(
  {
    name: "sales-brain-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 1. Registrar ferramentas disponíveis para as IAs clientes
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ingest_turn",
        description: "Ingere um novo turno de conversa de um lead no Sales Brain. Classifica sinais de interesse, urgência, objeções, atualiza a memória estruturada e recalcula dinamicamente a estratégia comercial de vendas de forma síncrona.",
        inputSchema: {
          type: "object",
          properties: {
            turnId: { 
              type: "string", 
              description: "ID único universal do turno para garantir idempotência estrita (ex: UUID ou hash único do chat/mensagem)" 
            },
            leadExternalId: { 
              type: "string", 
              description: "Identificador externo único do lead (ex: número de telefone no formato internacional, ID do CRM ou canal de chat)" 
            },
            leadName: { 
              type: "string", 
              description: "Nome completo do lead para personalização" 
            },
            conversationExternalId: { 
              type: "string", 
              description: "Identificador da conversa ou sessão de chat correspondente" 
            },
            role: { 
              type: "string", 
              description: "Papel do autor do turno. Geralmente 'user' (cliente) ou 'assistant' (vendedor/operador/IA)" 
            },
            content: { 
              type: "string", 
              description: "O texto/conteúdo cru da mensagem enviada no chat" 
            },
            contentType: { 
              type: "string", 
              description: "Tipo do conteúdo. Padrão é 'text'" 
            },
            timestamp: { 
              type: "string", 
              description: "Timestamp ISO opcional de quando a mensagem ocorreu (ex: 2026-05-24T17:26:00Z)" 
            },
            metadata: { 
              type: "object", 
              description: "Metadados adicionais opcionais (ex: app de origem, tags de anúncio, canal)" 
            }
          },
          required: ["turnId", "leadExternalId", "leadName", "conversationExternalId", "role", "content"]
        }
      },
      {
        name: "get_lead_context",
        description: "Recupera todo o contexto estruturado e inteligência consolidada de um lead (incluindo memórias quentes/históricas, fatos do perfil, objeções e tom comportamental calculado).",
        inputSchema: {
          type: "object",
          properties: {
            leadIdOrExternalId: { 
              type: "string", 
              description: "ID UUID interno ou o externalId do lead para busca" 
            }
          },
          required: ["leadIdOrExternalId"]
        }
      },
      {
        name: "recommend_reply",
        description: "Fornece recomendações estruturadas para redigir a próxima mensagem para o lead. Retorna diretrizes de tom (tone_directives), o que evitar (do_not_do), melhor ação persuasiva (best_move), estágio do funil e o histórico recente da conversa.",
        inputSchema: {
          type: "object",
          properties: {
            leadIdOrExternalId: { 
              type: "string", 
              description: "ID UUID interno ou o externalId do lead para busca" 
            }
          },
          required: ["leadIdOrExternalId"]
        }
      }
    ]
  };
});

// 2. Lidar com chamadas de ferramentas de IA
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  logger.info({ toolName: name }, '🛠️ Chamada de ferramenta MCP recebida no core');

  try {
    if (name === "ingest_turn") {
      const result = await TurnIngestionService.ingest(args as any);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Turno ingerido e reprocessado pelo Sales Brain com sucesso!",
              data: result
            }, null, 2)
          }
        ]
      };
    }

    if (name === "get_lead_context") {
      const { leadIdOrExternalId } = args as { leadIdOrExternalId: string };
      const context = await ReplyService.getRecommendationContext(leadIdOrExternalId);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(context, null, 2)
          }
        ]
      };
    }

    if (name === "recommend_reply") {
      const { leadIdOrExternalId } = args as { leadIdOrExternalId: string };
      const context = await ReplyService.getRecommendationContext(leadIdOrExternalId);
      
      // Formata um resumo textual em Markdown altamente amigável para prompts de IA
      const markdownSummary = `
### 🎯 Diretrizes Comerciais de Resposta para: ${context.lead.name}
* **Estágio do Funil Comercial:** ${context.funnel_stage}
* **Tamanho Recomendado da Mensagem:** ${context.strategy.message_length}

#### 🗣️ Diretrizes de Tom e Expressividade (Tone Directives):
${context.strategy.tone_directives.map((directive: string) => `- ${directive}`).join('\n')}

#### 🚀 Próximo Melhor Movimento Comercial (Best Move):
* ${context.strategy.best_move}

#### ❌ O que NÃO Fazer de forma alguma (Do Not Do):
* ${context.strategy.do_not_do}

#### 📣 Estilo de Chamada para Ação (CTA Style):
* ${context.strategy.cta_style}

${context.strategy.risks_detected.length > 0 ? `#### ⚠️ Riscos Detectados:\n${context.strategy.risks_detected.map((risk: string) => `- ${risk}`).join('\n')}` : ''}

#### 💬 Objeções Ativas Detectadas:
${context.active_objections.length > 0 
  ? context.active_objections.map((obj: any) => `- **Objeção:** ${obj.objection} (${obj.status}) | Confiança: ${(obj.confidence * 100).toFixed(0)}%`).join('\n') 
  : '* Nenhuma objeção ativa ou confirmada no momento.'
}

#### 👤 Fatos Conhecidos do Perfil:
${context.profile_facts.length > 0 
  ? context.profile_facts.map((fact: any) => `- **${fact.key} (${fact.scope}):** ${JSON.stringify(fact.value)}`).join('\n') 
  : '* Nenhum fato do perfil foi registrado ainda.'
}
      `.trim();

      return {
        content: [
          {
            type: "text",
            text: markdownSummary
          }
        ]
      };
    }

    throw new Error(`A ferramenta '${name}' não é suportada por este servidor MCP.`);
  } catch (err: any) {
    logger.error(err, { toolName: name }, '❌ Erro ao executar a ferramenta MCP no core');
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Erro ao executar a ferramenta MCP '${name}': ${err.message}`
        }
      ]
    };
  }
});
