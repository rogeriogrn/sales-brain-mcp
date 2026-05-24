# 📑 CODEBASE.md - Documentação Técnica do Sistema

Este arquivo centraliza a arquitetura, o mapa do código, o histórico de decisões e os contratos de API do **Sales Brain MCP** para garantir que desenvolvedores e agentes de IA compreendam a estrutura do sistema perfeitamente em futuras implementações.

---

## 🏛️ 1. Decisões de Arquitetura e Infraestrutura

### 1.1 SQLite (Banco de Dados Local de Zero Fricção)
- **Decisão:** O banco de dados físico foi configurado em **SQLite** (gerando o arquivo local `prisma/dev.db`).
- **Motivo:** Garantir a inicialização do projeto em qualquer máquina de forma instantânea sem a dependência obrigatória do Docker ou de instalações complexas do PostgreSQL local.
- **Portabilidade:** Como utilizamos o **Prisma ORM**, a migração de volta para o PostgreSQL de produção exige apenas a alteração da linha `provider = "postgresql"` no arquivo `prisma/schema.prisma` e a alteração da URL no arquivo `.env`.

### 1.2 Redis Fallback Wrapper (Resiliência Local)
- **Decisão:** Desenvolvemos um Wrapper transparente e resiliente de conexões em `src/repositories/redis/client.ts`.
- **Motivo:** Evitar que a indisponibilidade de um servidor Redis local cause travamentos ou quebra da inicialização do servidor.
- **Funcionamento:** Se a conexão falhar ou o Redis estiver desligado, o sistema ativa silenciosamente um backup em memória RAM utilizando um `Map` do JavaScript, mantendo o console livre de spam de logs de erro.

---

## 📂 2. Mapa do Repositório (Estrutura de Pastas)

```text
sales-brain/
  ├── prisma/
  │    ├── schema.prisma         # Schema físico relacional (SQLite)
  │    └── dev.db                # Banco de dados local auto-gerado
  ├── public/                    # Frontend SPA Admin Minimalista Suíço
  │    ├── index.html            # Interface HTML5 reativa
  │    └── app.js                # Lógica reativa de UI e fetch
  ├── src/
  │    ├── app/
  │    │    ├── controllers/
  │    │    │    ├── turn-controller.ts   # Validação e controle de Turnos
  │    │    │    ├── memory-controller.ts # Serialização e entrega de memórias
  │    │    │    ├── persona-controller.ts# Gerenciamento de snapshots de Persona
  │    │    │    └── lead-controller.ts   # Listagem de Leads cadastrados
  │    │    ├── middleware/
  │    │    │    └── auth.ts              # Validador de cabeçalho X-API-Key
  │    │    ├── routes/
  │    │    │    ├── health.ts            # Integridade física das conexões
  │    │    │    ├── turns.ts             # Rota protegida de ingestão de turnos
  │    │    │    ├── memory.ts            # Rota protegida de consulta de memórias
  │    │    │    └── persona.ts           # Rota protegida de snapshots de Persona
  │    │    └── index.ts                  # Ponto de entrada do Fastify
  │    ├── services/
  │    │    ├── turn-ingestion/
  │    │    │    └── index.ts             # Serviço de Ingestão e Idempotência
  │    │    ├── signal-extraction/
  │    │    │    └── index.ts             # Extrator heurístico de sinais
  │    │    ├── memory/
  │    │    │    └── index.ts             # Motor de promoção e enfraquecimento
  │    │    └── persona/
  │    │         └── index.ts             # Processamento e calibração da Persona
  │    ├── repositories/
  │    │    └── postgres/                 # Acesso físico via Prisma ORM
  │    │    │    ├── client.ts            # Inicializador do Prisma Client
  │    │    │    ├── lead.ts              # Repositório de Leads
  │    │    │    ├── conversation.ts      # Repositório de Conversas
  │    │    │    ├── turn.ts              # Repositório de Turnos
  │    │    │    ├── signal.ts            # Repositório de Sinais
  │    │    │    ├── memory.ts            # Repositório de Itens de Memória
  │    │    │    ├── persona.ts           # Repositório de Snapshots de Persona
  │    │    │    └── audit.ts             # Repositório de Eventos de Auditoria
  │    │    └── redis/
  │    │         └── client.ts            # Cliente Redis Resiliente com Fallback
  │    └── shared/
  │         ├── config/
  │         │    └── index.ts             # Validador de variáveis .env (Zod)
  │         └── logger/
  │              └── index.ts             # Logging Estruturado (Pino/Pino-Pretty)
  ├── .env                       # Variáveis de ambiente locais (ignorado no git)
  ├── .env.example               # Modelo limpo de variáveis de ambiente
  ├── .gitignore                 # Arquivo de segurança do Git
  ├── package.json               # Dependências do Node.js
  ├── tsconfig.json              # Configurações TypeScript
  └── docker-compose.yml         # Containerizador de Postgres e Redis oficiais
```

---

## 🗄️ 3. Tabelas e Modelagem de Dados Atuais
O banco relacional possui as seguintes tabelas estruturadas no `schema.prisma`:
- **`leads`**: Identificação única de contatos comerciais por `externalId`.
- **`conversations`**: Agrupamentos lógicos de mensagens associados a um Lead.
- **`turns`**: O histórico de mensagens (`user`, `assistant`, etc.) contendo um campo `turnId` único e indexado para **idempotência**.
- **`signals`**: Armazenamento de pistas analíticas extraídas de cada mensagem.
- **`memory_items`**: Itens de memória de longo e curto prazo divididos em escopos (`hot`, `profile`, `canonical`, `archive`, `retracted`) e associados a um score de confiança.
- **`persona_snapshots`**: Versões históricas de comportamento do Lead.
- **`strategy_snapshots`**: Recomendações de tom de voz e CTA.
- **`reply_recommendations`**: Respostas sugeridas pela IA para auditoria posterior.
- **`audit_events`**: Histórico detalhado de modificações no perfil do Lead.

---

## 🚀 4. Contratos de API Implementados

### 4.0 Listagem de Leads Cadastrados
- **Rota:** `GET /v1/leads`
- **Autenticação:** Protegida (Header `X-API-Key`)
- **Resposta Sucesso (`200 OK`):**
```json
[
  {
    "id": "301b0a66-c000-48e1-920b-fa2db447b638",
    "externalId": "lead_ext_test_999",
    "name": "Carlos Henrique",
    "phone": null,
    "email": null,
    "source": "chat-widget",
    "status": "active",
    "createdAt": "2026-05-24T19:59:16.499Z",
    "updatedAt": "2026-05-24T19:59:16.499Z"
  }
]
```

### 4.1 Check de Saúde
- **Rota:** `GET /health`
- **Autenticação:** Pública (Livre)
- **Resposta Sucesso (`200 OK`):**
```json
{
  "status": "healthy",
  "services": {
    "postgres": "OK",
    "redis": "OK"
  },
  "timestamp": "2026-05-24T19:56:50.290Z"
}
```

### 4.2 Ingestão de Turnos
- **Rota:** `POST /v1/turns/ingest`
- **Autenticação:** Protegida (Header `X-API-Key`)
- **Payload Exemplo:**
```json
{
  "turnId": "turn_test_001",
  "leadExternalId": "lead_ext_test_999",
  "leadName": "Carlos Henrique",
  "conversationExternalId": "conv_test_abc",
  "role": "user",
  "content": "Gostaria de saber o preco do plano basico e se tem garantia por pix.",
  "metadata": {
    "source_app": "chat-widget"
  }
}
```
- **Resposta Criação (`201 Created`):**
```json
{
  "ok": true,
  "leadId": "301b0a66-c000-48e1-920b-fa2db447b638",
  "conversationId": "c6b9e2f7-0ed8-4308-9a79-297cf20ad2e3",
  "turnId": "36a270fc-0e21-4269-a2c5-bc672251bc26",
  "isDuplicate": false
}
```
- **Resposta Duplicata Idempotente (`200 OK`):**
```json
{
  "ok": true,
  "leadId": "301b0a66-c000-48e1-920b-fa2db447b638",
  "conversationId": "c6b9e2f7-0ed8-4308-9a79-297cf20ad2e3",
  "turnId": "36a270fc-0e21-4269-a2c5-bc672251bc26",
  "isDuplicate": true
}
```

### 4.3 Leitura da Memória Viva do Lead
- **Rota:** `GET /v1/leads/:leadId/memory`
- **Autenticação:** Protegida (Header `X-API-Key`)
- **Resposta Sucesso (`200 OK`):**
```json
{
  "leadId": "301b0a66-c000-48e1-920b-fa2db447b638",
  "memory": {
    "hot": [
      {
        "key": "urgency_state",
        "value": { "value": "HIGH", "score": 0.6, "lastUpdatedFromTurn": "ace587d2-8e8b-4a3b-b451-5f182f918aa9" },
        "confidence": 0.6,
        "status": "confirmed"
      },
      {
        "key": "current_objection",
        "value": { "value": "PRICE_OBJECTION", "score": 0.8 },
        "confidence": 0.4,
        "status": "weakened"
      }
    ],
    "profile": [
      {
        "key": "price_sensitivity",
        "value": { "value": "MEDIUM", "score": 0.45, "lastUpdatedFromTurn": "ace587d2-8e8b-4a3b-b451-5f182f918aa9" },
        "confidence": 0.45,
        "status": "hypothesis"
      }
    ],
    "canonical": [],
    "retracted": []
  },
  "rawCount": 3
}
```

### 4.4 Leitura do Snapshot Recente da Persona
- **Rota:** `GET /v1/leads/:leadId/persona`
- **Autenticação:** Protegida (Header `X-API-Key`)
- **Resposta Sucesso (`200 OK`):**
```json
{
  "leadId": "301b0a66-c000-48e1-920b-fa2db447b638",
  "version": 1,
  "persona": {
    "communication_profile": {
      "directness": 0.85,
      "verbosity": 0.35,
      "analytical": 0.7,
      "emotionality": 0.6
    },
    "decision_profile": {
      "price_sensitivity": 0.45,
      "trust_gap": 0.85,
      "urgency": 0.6,
      "decision_speed": 0.98
    }
  },
  "createdAt": "2026-05-24T20:13:45.976Z",
  "generatedFromTurnId": "796f63f0-5837-4dff-a6d6-86ebdb966c3f"
}
```

### 4.5 Leitura do Snapshot Recente de Estratégia Comercial
- **Rota:** `GET /v1/leads/:leadId/strategy`
- **Autenticação:** Protegida (Header `X-API-Key`)
- **Resposta Sucesso (`200 OK`):**
```json
{
  "leadId": "301b0a66-c000-48e1-920b-fa2db447b638",
  "version": 1,
  "stage": "VALUE_PROOF",
  "strategy": {
    "tone_directives": [
      "Consultivo",
      "Profissional",
      "Transparência absoluta",
      "Foque em segurança e garantias"
    ],
    "message_length": "medium_balanced",
    "best_move": "Apresentar provas de autoridade e segurança (CNPJ, tempo de mercado, depoimentos) para diminuir a fenda de confiança.",
    "do_not_do": "Não empurre produtos sem entender o real interesse do cliente. Evite usar gatilhos de escassez ou urgência falsos, pois isso aumentará a desconfiança.",
    "cta_style": "CTA Suave: Perguntar se gostaria de ver um exemplo de sucesso de outro cliente.",
    "risks_detected": []
  },
  "createdAt": "2026-05-24T20:19:23.238Z",
  "generatedFromTurnId": "15b0f7c5-49f2-4137-ad13-8a8989a67ecb"
}
```

### 4.6 Sugestão de Abordagem de Resposta (Suggested Reply)
- **Rota:** `GET /v1/leads/:leadId/reply/recommend`
- **Autenticação:** Protegida (Header `X-API-Key`)
- **Resposta Sucesso (`200 OK`):**
```json
{
  "lead": {
    "id": "301b0a66-c000-48e1-920b-fa2db447b638",
    "externalId": "lead_ext_test_999",
    "name": "Carlos Henrique"
  },
  "funnel_stage": "VALUE_PROOF",
  "strategy": {
    "version": 1,
    "tone_directives": [
      "Consultivo",
      "Profissional",
      "Transparência absoluta",
      "Foque em segurança e garantias"
    ],
    "message_length": "medium_balanced",
    "best_move": "Apresentar provas de autoridade e segurança (CNPJ, tempo de mercado, depoimentos) para diminuir a fenda de confiança.",
    "do_not_do": "Não empurre produtos sem entender o real interesse do cliente. Evite usar gatilhos de escassez ou urgência falsos, pois isso aumentará a desconfiança.",
    "cta_style": "CTA Suave: Perguntar se gostaria de ver um exemplo de sucesso de outro cliente.",
    "risks_detected": []
  },
  "active_objections": [
    {
      "objection": "PRICE_OBJECTION",
      "status": "weakened",
      "confidence": 0.4
    }
  ],
  "profile_facts": [
    {
      "key": "urgency_state",
      "value": { "value": "HIGH", "score": 0.6 },
      "scope": "hot"
    },
    {
      "key": "trust_gap",
      "value": { "value": "HIGH", "score": 0.8 },
      "scope": "profile"
    }
  ],
  "recent_conversation": [
    {
      "role": "user",
      "content": "Preciso saber o preço com urgência hoje. Tem garantia de cnpj seguro? Mas achei muito caro comparado ao concorrente.",
      "eventAt": "2026-05-24T20:06:41.711Z"
    }
  ]
}
```

---

## 🔌 5. Camada do Servidor MCP (Model Context Protocol)

O **Sales Brain MCP** atua como um servidor de contexto oficial, expondo dados analíticos e heurísticas de forma nativa para IAs parceiras (como o Claude Desktop ou pipelines orquestrados).

### 5.1 Protocolo Híbrido de Transporte
1. **Stdio (Local):** Arquivo executável de linha de comando `src/mcp-server.ts` executado localmente.
2. **SSE (Rede):** Endpoints HTTP integrados na rota Fastify:
   - `GET /v1/mcp/sse`: Canal de eventos unidirecionais estabelecido com a IA cliente.
   - `POST /v1/mcp/messages`: Canal de recebimento de chamadas de métodos JSON-RPC do MCP.

### 5.2 Catálogo de Ferramentas (MCP Tools)
- **`ingest_turn`**: Permite à IA cliente registrar a ocorrência de novos turnos de mensagens em tempo de execução, desencadeando toda a análise de sinais, calibração comportamental de Persona e computação de diretrizes comerciais do backend.
- **`get_lead_context`**: Retorna memórias de curto/longo prazo consolidado, objeções e dados de perfil do Lead de forma unificada.
- **`recommend_reply`**: O motor mais avançado de recomendação. Retorna o resumo analítico e diretrizes ricas em Markdown de tom, CTAs e melhor jogada para que a IA parceira formule a melhor resposta possível sem adivinhações.
