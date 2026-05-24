# 05. API e Webhooks
## Objetivo
Documentar a API principal do projeto e mostrar como o sistema pode receber eventos externos, mesmo sem depender de um canal específico.

Neste contexto, "webhook" significa apenas uma entrada HTTP controlada por você ou por outro sistema seu.

## 1. Princípio de API
A API deve ser:

- simples
- previsível
- pequena
- orientada a casos de uso
- fácil de testar via curl, Postman ou script
## 2. Versionamento
Use versionamento desde o início:

- /v1/turns/ingest
- /v1/leads/:id/snapshot
Isso evita dor de cabeça no futuro.

## 3. Formato de autenticação
Para projeto pessoal ou MVP:

- x-api-key: SUA_CHAVE
Alternativamente:

Authorization: Bearer SUA_CHAVE
Recomendação: padronize com x-api-key no começo para simplificar.

## 4. Endpoint principal: ingestão de turno
### Rota
POST /v1/turns/ingest

### Objetivo
Receber um novo turno da conversa.

### Payload sugerido
```json
{
  "turn_id": "turn_001",
  "lead": {
    "external_id": "lead_ext_123",
    "name": "Carlos"
  },
  "conversation": {
    "external_id": "conv_abc",
    "channel": "custom-ui"
  },
  "message": {
    "role": "user",
    "content": "quanto fica no pix e tem garantia?",
    "content_type": "text",
    "timestamp": "2025-01-15T20:11:00Z"
  },
  "metadata": {
    "operator_id": "op_1",
    "source_app": "sales-panel"
  }
}
```
### Resposta esperada
```json
{
  "ok": true,
  "lead_id": "uuid",
  "conversation_id": "uuid",
  "turn_internal_id": "uuid",
  "snapshot": {
    "stage": "OBJECTION_HANDLING",
    "persona": {
      "price_sensitivity": 0.78,
      "trust_gap": 0.71
    },
    "strategy": {
      "tone": "consultive_direct",
      "best_move": "answer_price_with_value_and_reassurance"
    }
  },
  "reply_recommendation": {
    "text": "Tem sim. No pix fica X e eu também te explico rapidamente o que está incluído para fazer sentido no valor."
  }
}
```
## 5. Endpoint: obter snapshot
### Rota
GET /v1/leads/:leadId/snapshot

### Objetivo
Devolver o estado compacto mais recente do lead.

### Resposta exemplo
```json
{
  "lead_id": "uuid",
  "snapshot_version": 8,
  "stage": "OFFER",
  "temperature": "warm",
  "persona": {
    "analytical": 0.66,
    "price_sensitivity": 0.74,
    "trust_gap": 0.49
  },
  "state": {
    "main_objection": "price",
    "purchase_intent": 0.81,
    "ghosting_risk": 0.18
  },
  "strategy": {
    "tone": "consultive_direct",
    "message_length": "short_structured",
    "proof_type": "guarantee_plus_case",
    "cta": "advance_softly"
  }
}
```
## 6. Endpoint: upsert de fato
### Rota
POST /v1/leads/:leadId/facts/upsert

### Objetivo
Inserir ou atualizar um fato manualmente.

### Payload exemplo
```json
{
  "scope": "canonical",
  "key": "payment_preference",
  "value": {
    "method": "pix"
  },
  "confidence": 0.95,
  "source_type": "manual"
}
```
## 7. Endpoint: retract de fato
### Rota
POST /v1/leads/:leadId/facts/retract

### Objetivo
Invalidar um fato anteriormente salvo.

### Payload exemplo
```json
{
  "key": "urgent_purchase",
  "reason": "lead perdeu prazo e disse que só vai avaliar mês que vem",
  "source_type": "manual"
}
```
## 8. Endpoint: recompute
### Rota
POST /v1/leads/:leadId/recompute

### Objetivo
Forçar recomputação de memória/persona/estratégia.

### Payload exemplo
```json
{
  "recompute": ["persona", "strategy", "snapshot"]
}
```
## 9. Endpoint: recomendação de resposta
### Rota
POST /v1/leads/:leadId/reply/recommend

### Objetivo
Gerar uma nova resposta sugerida.

### Payload exemplo
```json
{
  "last_user_message": "entendi, mas ainda achei meio caro",
  "style_override": null
}
```
### Resposta exemplo
```json
{
  "reply_text": "Faz sentido olhar o valor com cuidado. Se quiser, eu te resumo em 3 pontos o que está incluso e por que costuma compensar para quem busca esse resultado."
}
```
## 10. Endpoint: health check
### Rota
GET /health

### Objetivo
Verificar se a aplicação está viva.

Resposta
```json
{
  "status": "ok"
}
```
## 11. Endpoint: webhook genérico
Se você quiser um endpoint de entrada mais "cego", use:

### Rota
POST /v1/events/inbound

### Objetivo
Receber qualquer evento e roteá-lo internamente.

Payload genérico
```json
{
  "event_type": "conversation.turn.created",
  "payload": {
    "turn_id": "turn_100",
    "lead_external_id": "lead_1",
    "role": "user",
    "content": "quero entender melhor"
  }
}
```
### Quando usar
- integração com outro sistema seu
- fila intermediária
- automações customizadas
## 12. Contratos de erro
Padronize erros desde cedo.

### Exemplo
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "field message.content is required"
  }
}
```
### Códigos úteis
- VALIDATION_ERROR
- UNAUTHORIZED
- NOT_FOUND
- CONFLICT
- INTERNAL_ERROR
- RATE_LIMITED
## 13. Regras de validação importantes
turn_id
Obrigatório para idempotência.

lead.external_id
Muito útil para mapear lead entre sistemas.

message.role
Somente valores conhecidos:

- user
- assistant
- operator
- system
- message.content
Obrigatório para turnos textuais.

timestamp
Sempre que possível use ISO 8601 UTC.

## 14. Estratégia de resposta da API
Toda resposta importante deve incluir:

- ok
- ids principais
- resultado de negócio
- snapshot resumido
- mensagem de erro bem clara quando falhar
## 15. Teste rápido via curl
### Exemplo
```bash
curl -X POST http://localhost:3000/v1/turns/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key" \
  -d '{
    "turn_id": "turn_001",
    "lead": {"external_id": "lead_ext_123", "name": "Carlos"},
    "conversation": {"external_id": "conv_abc", "channel": "custom-ui"},
    "message": {
      "role": "user",
      "content": "quanto fica no pix e tem garantia?",
      "content_type": "text",
      "timestamp": "2025-01-15T20:11:00Z"
    }
  }'
```
## 16. Resumo final
A API deve ser pequena e forte.
O endpoint mais importante é o de ingestão.
Todo o resto gira em torno de manter e expor um snapshot comercial útil.
