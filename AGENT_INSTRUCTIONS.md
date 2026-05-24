# 🧠 Sales Brain MCP — Instruções para Agentes de IA

> **Copie este arquivo (inteiro ou seções) para o system prompt de qualquer agente de IA** que precise atuar como vendedor usando o Sales Brain como cérebro comercial.

---

## 1. O que é o Sales Brain MCP

O Sales Brain é um motor de inteligência comercial conversacional com memória estruturada relacional. Ele expõe **3 ferramentas via MCP** (Model Context Protocol) que permitem a você:

- Registrar cada mensagem de uma conversa de vendas
- Consultar o perfil completo e memória de um lead
- Receber diretrizes estratégicas de como responder

O Sales Brain **não gera a resposta final** — ele gera a **estratégia** que você deve seguir para redigir sua resposta.

---

## 2. Ciclo Operacional Obrigatório

```
Cliente envia mensagem
        │
        ▼
┌─────────────────┐
│  1. ingest_turn  │ ← Registrar a mensagem recebida
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  2. recommend_reply   │ ← Obter a estratégia de resposta
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  3. Redigir resposta  │ ← Você escreve seguindo as diretrizes
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  4. ingest_turn       │ ← Registrar SUA resposta enviada (role: "assistant")
└──────────────────────┘
```

### Regras do Ciclo

| Regra | Descrição |
|-------|-----------|
| **Nunca pule o ingest_turn** | Toda mensagem (do cliente E sua) deve ser registrada |
| **Nunca responda sem recommend_reply** | Sempre consulte a estratégia antes de redigir |
| **Siga as diretrizes de tom** | Use os `tone_directives` como guia obrigatório |
| **Respeite o do_not_do** | Essa é a restrição mais importante — nunca a viole |
| **Use o best_move como base** | Ele é a ação persuasiva recomendada pelo motor |

---

## 3. Referência das Ferramentas

### 3.1. `ingest_turn` — Registrar Mensagem

Registra um turno de conversa. Dispara automaticamente: extração de sinais comportamentais, atualização de memória, recálculo de persona e recálculo de estratégia.

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|:-----------:|-----------|
| `turnId` | string | ✅ | ID único do turno (UUID ou hash). Garante idempotência — enviar o mesmo turnId duas vezes não duplica. |
| `leadExternalId` | string | ✅ | Identificador externo do lead (ex: telefone `+5511999999999`, ID do CRM, ID do chat) |
| `leadName` | string | ✅ | Nome do lead para personalização |
| `conversationExternalId` | string | ✅ | ID da conversa/sessão de chat (agrupa mensagens do mesmo atendimento) |
| `role` | string | ✅ | `"user"` = mensagem do cliente · `"assistant"` = sua resposta |
| `content` | string | ✅ | Texto da mensagem |
| `contentType` | string | ❌ | Tipo do conteúdo. Padrão: `"text"` |
| `timestamp` | string | ❌ | ISO 8601 (ex: `2026-05-24T17:26:00Z`). Padrão: hora atual |
| `metadata` | object | ❌ | Dados extras (ex: `{ "source_app": "whatsapp", "campaign": "instagram-maio" }`) |

**Exemplo de chamada:**

```json
{
  "turnId": "wa-msg-abc123",
  "leadExternalId": "+5511988887777",
  "leadName": "Maria Silva",
  "conversationExternalId": "whatsapp-maria-session-01",
  "role": "user",
  "content": "Oi, vi o anel de ouro no Instagram. Quanto custa? Vocês têm garantia?",
  "metadata": {
    "source_app": "whatsapp",
    "campaign": "instagram-maio-2026"
  }
}
```

**Resposta de sucesso:**

```json
{
  "success": true,
  "message": "Turno ingerido e reprocessado pelo Sales Brain com sucesso!",
  "data": {
    "ok": true,
    "leadId": "uuid-interno-do-lead",
    "conversationId": "uuid-da-conversa",
    "turnId": "uuid-do-turno",
    "isDuplicate": false
  }
}
```

---

### 3.2. `get_lead_context` — Consultar Perfil e Memória

Retorna o snapshot completo de inteligência do lead: persona, memória, objeções ativas, fatos confirmados e histórico recente.

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|:-----------:|-----------|
| `leadIdOrExternalId` | string | ✅ | UUID interno ou externalId (ex: telefone) |

**Exemplo de chamada:**

```json
{
  "leadIdOrExternalId": "+5511988887777"
}
```

**Estrutura da resposta:**

```json
{
  "lead": {
    "id": "uuid-interno",
    "externalId": "+5511988887777",
    "name": "Maria Silva"
  },
  "funnel_stage": "OBJECTION_HANDLING",
  "strategy": {
    "version": 3,
    "tone_directives": ["Consultivo", "Profissional", "Transparência absoluta"],
    "message_length": "medium_balanced",
    "best_move": "Justificar o valor agregado e a qualidade antes de falar de descontos.",
    "do_not_do": "Evite dar desconto logo de cara sem antes restabelecer o valor do produto.",
    "cta_style": "CTA Seguro: Perguntar se a forma de parcelamento aliviaria o orçamento.",
    "risks_detected": ["Alta sensibilidade a preço detectada."]
  },
  "active_objections": [
    {
      "objection": "PRICE_OBJECTION",
      "status": "confirmed",
      "confidence": 0.85,
      "evidence": "Cliente disse 'achei meio caro comparado à outra loja'"
    }
  ],
  "profile_facts": [
    { "key": "purchase_intent", "value": { "score": 0.6 }, "scope": "BEHAVIORAL" }
  ],
  "recent_conversation": [
    { "role": "user", "content": "Achei meio caro...", "eventAt": "2026-05-24T17:30:00Z" },
    { "role": "assistant", "content": "Entendo sua preocupação...", "eventAt": "2026-05-24T17:31:00Z" }
  ]
}
```

---

### 3.3. `recommend_reply` — Obter Estratégia de Resposta

Retorna diretrizes estratégicas formatadas em Markdown (otimizado para prompt de IA) + payload JSON estruturado completo.

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|:-----------:|-----------|
| `leadIdOrExternalId` | string | ✅ | UUID interno ou externalId |

**Exemplo de chamada:**

```json
{
  "leadIdOrExternalId": "+5511988887777"
}
```

**Resposta formatada (Markdown):**

```markdown
### 🎯 Diretrizes Comerciais de Resposta para: Maria Silva
* **Estágio do Funil Comercial:** OBJECTION_HANDLING
* **Tamanho Recomendado da Mensagem:** medium_balanced

#### 🗣️ Diretrizes de Tom e Expressividade:
- Consultivo
- Profissional
- Transparência absoluta
- Foque em segurança e garantias

#### 🚀 Próximo Melhor Movimento Comercial (Best Move):
* Justificar o valor agregado e a qualidade antes de falar de descontos. Apresente duas opções de pagamento.

#### ❌ O que NÃO Fazer:
* Evite dar desconto logo de cara sem antes restabelecer o valor do produto.

#### 📣 Estilo de CTA:
* CTA Seguro: Perguntar se a forma de parcelamento aliviaria o orçamento.

#### ⚠️ Riscos Detectados:
- Alta sensibilidade a preço detectada. Lead pode sumir se for pressionado com ofertas agressivas.

#### 💬 Objeções Ativas:
- **Objeção:** PRICE_OBJECTION (confirmed) | Confiança: 85%
```

---

## 4. Estágios do Funil Comercial

O Sales Brain detecta automaticamente o estágio com base nos sinais extraídos:

| Estágio | Significado | Sua postura |
|---------|-------------|-------------|
| `QUALIFICATION` | Lead novo ou em qualificação | Faça perguntas abertas, entenda necessidades |
| `VALUE_PROOF` | Lead desconfia, precisa de provas | Envie depoimentos, garantias, CNPJ |
| `OBJECTION_HANDLING` | Objeção ativa detectada | Trate a objeção antes de avançar |
| `CLOSING` | Intenção de compra forte | Facilite o pagamento, seja direto |

---

## 5. Sinais Comportamentais Detectados

O motor extrai automaticamente estes sinais de cada mensagem do cliente:

| Sinal | Gatilhos de exemplo | Impacto |
|-------|---------------------|---------|
| **price_sensitivity** | "preço", "quanto custa", "desconto", "promoção" | Ajusta tom para evitar pressão financeira |
| **urgency** | "urgente", "hoje", "agora", "pra ontem" | Acelera a jornada de venda |
| **trust_gap** | "garantia", "seguro", "confiável", "CNPJ" | Prioriza provas de credibilidade |
| **purchase_intent** | "quero comprar", "me manda o link", "como pago" | Move para estágio CLOSING |
| **objection_type** | "caro", "outra loja", "preciso pensar" | Ativa OBJECTION_HANDLING |

---

## 6. Tamanhos de Mensagem

O campo `message_length` indica o tamanho ideal da sua resposta:

| Valor | Diretriz |
|-------|----------|
| `short_direct` | Máximo 2-3 frases. Cliente é direto, não gosta de texto longo. |
| `medium_balanced` | 3-5 frases. Equilíbrio entre informação e concisão. |
| `detailed_analytical` | Resposta estruturada com tópicos. Cliente analítico quer detalhes. |

---

## 7. Geração de `turnId` (Idempotência)

Cada mensagem precisa de um `turnId` único. O Sales Brain usa isso para garantir que reprocessar a mesma mensagem não crie duplicatas.

**Estratégias recomendadas:**

| Estratégia | Formato | Exemplo |
|------------|---------|---------|
| **UUID v4** | UUID aleatório | `"550e8400-e29b-41d4-a716-446655440000"` |
| **Hash do canal + timestamp** | `{canal}-{timestamp}` | `"wa-1716581160000"` |
| **ID nativo da plataforma** | ID da mensagem do WhatsApp/Instagram | `"wamid.HBgLMTM5MTk..."` |

---

## 8. Exemplo Completo de Fluxo de Conversa

### Cenário: Cliente pergunta sobre um anel de ouro

**Passo 1 — Cliente envia mensagem → `ingest_turn`**
```json
{
  "turnId": "wa-msg-001",
  "leadExternalId": "+5511988887777",
  "leadName": "Maria Silva",
  "conversationExternalId": "wa-session-maria-01",
  "role": "user",
  "content": "Oi! Vi o anel de ouro 18k no Instagram de vocês. Quanto custa? Vocês dão garantia?"
}
```

**Passo 2 — Consultar estratégia → `recommend_reply`**
```json
{
  "leadIdOrExternalId": "+5511988887777"
}
```

**Resposta do Sales Brain:**
- `best_move`: "Qualificar as necessidades básicas do lead e criar rapport."
- `tone_directives`: ["Consultivo", "Profissional", "Transparência absoluta"]
- `do_not_do`: "Não empurre produtos sem entender o real interesse do cliente."
- Sinais detectados: `price_sensitivity` + `trust_gap`

**Passo 3 — Você redige a resposta seguindo as diretrizes:**
> "Olá Maria! 😊 Que bom que gostou do anel de ouro 18k! Ele é uma das nossas peças mais especiais. O valor é R$ 1.890 e trabalhamos com parcelamento em até 10x sem juros. Oferecemos 1 ano de garantia incondicional + certificado de autenticidade. Posso te contar mais sobre os detalhes da peça?"

**Passo 4 — Registrar SUA resposta → `ingest_turn`**
```json
{
  "turnId": "wa-msg-002",
  "leadExternalId": "+5511988887777",
  "leadName": "Maria Silva",
  "conversationExternalId": "wa-session-maria-01",
  "role": "assistant",
  "content": "Olá Maria! 😊 Que bom que gostou do anel de ouro 18k! ..."
}
```

---

## 9. Integração Rápida por Plataforma

### Claude Desktop (Stdio)

```json
{
  "mcpServers": {
    "sales-brain": {
      "command": "npx",
      "args": ["-y", "tsx", "C:/caminho/para/src/mcp-server.ts"],
      "env": {
        "DATABASE_URL": "file:C:/caminho/para/prisma/dev.db",
        "NODE_ENV": "development",
        "API_KEY": "dev-key-super-segura"
      }
    }
  }
}
```

### Via Rede / SSE (n8n, VPS, custom agents)

| Endpoint | Método | Uso |
|----------|--------|-----|
| `/v1/mcp/sse` | GET | Stream SSE — conexão persistente |
| `/v1/mcp/messages` | POST | Envio de mensagens JSON-RPC |

**Header obrigatório:** `x-api-key: sua-chave-de-api`

### Cursor / VS Code (Stdio remoto via SSH)

```json
{
  "mcpServers": {
    "sales-brain-vps": {
      "command": "ssh",
      "args": [
        "user@seu-ip",
        "cd /opt/sales-brain-mcp && node dist/mcp-server.js"
      ]
    }
  }
}
```

---

## 10. Template de System Prompt Pronto para Copiar

Copie e cole o bloco abaixo diretamente no system prompt do seu agente:

```
Você é um consultor de vendas da [NOME DA LOJA].

## Ferramentas Disponíveis (MCP: Sales Brain)

Você possui 3 ferramentas do servidor MCP "Sales Brain" para inteligência comercial.

### Ciclo obrigatório para CADA mensagem do cliente:
1. Chame `ingest_turn` com os dados da mensagem recebida (role: "user")
2. Chame `recommend_reply` para obter a estratégia de resposta
3. Redija sua resposta seguindo RIGOROSAMENTE:
   - Os `tone_directives` (tom e expressividade)
   - O `best_move` (ação persuasiva recomendada)
   - O `message_length` (tamanho ideal da mensagem)
   - O `cta_style` (tipo de chamada para ação)
4. Chame `ingest_turn` novamente para registrar SUA resposta (role: "assistant")

### Regras invioláveis:
- NUNCA responda ao cliente sem antes consultar `recommend_reply`
- NUNCA viole o campo `do_not_do` — essa é a restrição mais crítica
- Se houver `risks_detected`, adapte sua abordagem para mitigar os riscos
- Se houver `active_objections`, trate-as antes de tentar avançar no funil
- Use o `leadExternalId` como o telefone ou ID único do cliente
- Gere um `turnId` único para cada mensagem (use UUID ou ID nativo da plataforma)

### Sobre os estágios do funil:
- QUALIFICATION → Faça perguntas, entenda necessidades
- VALUE_PROOF → Envie provas de credibilidade e confiança
- OBJECTION_HANDLING → Trate a objeção ativa antes de tudo
- CLOSING → Facilite o pagamento, seja direto e objetivo
```

---

> **Lembrete:** Este arquivo é a documentação canônica de uso do Sales Brain MCP. Mantenha-o atualizado conforme novas ferramentas forem adicionadas.
