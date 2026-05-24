# 03. Modelagem de Dados

## Objetivo

Definir uma modelagem de dados simples, clara e prática para o projeto, sem exagero acadêmico, mas com rigor suficiente para permitir:

- persistência correta
- replay
- auditoria
- versionamento de snapshot
- recalibração de persona
- uso por API e MCP

---

## 1. Princípios da modelagem

### 1.1 Separar tipos de memória
Não guardar tudo em uma tabela genérica.

### 1.2 Guardar origem e confiança
Toda inferência relevante precisa de:

- origem
- score de confiança
- data/hora
- status

### 1.3 Suportar contradição
O sistema precisa registrar quando um fato foi:

- confirmado
- enfraquecido
- retraído

### 1.4 Suportar reprocessamento
Se a lógica de scoring mudar, o histórico bruto precisa continuar acessível.

---

## 2. Entidades principais

- leads
- conversations
- turns
- signals
- memory_items
- persona_snapshots
- strategy_snapshots
- reply_recommendations
- domain_rules
- audit_events

---

## 3. Tabela: leads

Representa a entidade principal do cliente/lead.

### Campos sugeridos

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | identificador do lead |
| external_id | text | id externo do lead no sistema chamador |
| name | text | nome do lead |
| phone | text | opcional |
| email | text | opcional |
| source | text | origem do lead |
| status | text | status geral |
| created_at | timestamptz | criação |
| updated_at | timestamptz | atualização |

### Observações
- `external_id` ajuda a mapear o lead vindo de outro sistema
- `status` pode ser algo simples: active, paused, archived

---

## 4. Tabela: conversations

Representa um agrupamento lógico de turnos.

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | identificador da conversa |
| lead_id | uuid | referência ao lead |
| channel | text | canal lógico |
| title | text | opcional |
| started_at | timestamptz | início |
| ended_at | timestamptz | fim opcional |
| created_at | timestamptz | criação |
| updated_at | timestamptz | atualização |

### Observações
Mesmo que o projeto seja agnóstico de canal, manter `channel` é útil para futuras extensões.

---

## 5. Tabela: turns

Registra cada turno de mensagem.

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | id interno |
| conversation_id | uuid | referência à conversa |
| turn_id | text | id idempotente externo |
| role | text | user, assistant, operator, system |
| content | text | texto principal |
| content_type | text | text, note, summary, etc |
| metadata_json | jsonb | metadados adicionais |
| created_at | timestamptz | quando chegou |
| event_at | timestamptz | quando aconteceu |

### Índices sugeridos
- índice por `conversation_id`
- índice por `turn_id` único
- índice por `event_at`

---

## 6. Tabela: signals

Armazena sinais extraídos de um turno.

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | identificador |
| lead_id | uuid | referência |
| turn_id | uuid | turno que originou |
| signal_type | text | tipo do sinal |
| signal_value | text | valor categórico ou textual |
| score | numeric | intensidade ou confiança |
| evidence_json | jsonb | evidências |
| created_at | timestamptz | criação |

### Exemplos de `signal_type`
- purchase_intent
- urgency
- price_sensitivity
- trust_gap
- communication_style
- emotional_tone
- objection_type

---

## 7. Tabela: memory_items

Esta é a tabela mais importante.
Ela representa itens de memória estruturada.

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | identificador |
| lead_id | uuid | referência |
| memory_scope | text | hot, profile, canonical, archive, retracted |
| key | text | chave semântica |
| value_json | jsonb | valor |
| confidence | numeric | confiança |
| status | text | hypothesis, confirmed, weakened, retracted |
| source_type | text | llm, rule, manual, import |
| source_ref | text | referência da origem |
| first_seen_at | timestamptz | primeira vez |
| last_seen_at | timestamptz | última vez |
| expires_at | timestamptz | expiração opcional |
| created_at | timestamptz | criação |
| updated_at | timestamptz | atualização |

### Exemplos de `memory_scope`
- `hot`: estado atual
- `profile`: traços relativamente estáveis
- `canonical`: fato estável
- `archive`: memória antiga resumida
- `retracted`: itens invalidados

### Exemplos de `key`
- current_objection
- preferred_message_length
- decision_style
- product_interest
- payment_preference
- trust_gap
- urgency_state

---

## 8. Tabela: persona_snapshots

Guarda a persona agregada em determinado momento.

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | identificador |
| lead_id | uuid | referência |
| version | integer | versão do snapshot |
| persona_json | jsonb | estrutura da persona |
| generated_from_turn_id | uuid | turno base |
| created_at | timestamptz | criação |

### Observações
Não é obrigatório salvar todas as versões para sempre, mas é útil para auditoria e evolução do sistema.

---

## 9. Tabela: strategy_snapshots

Registra a estratégia calculada para o lead naquele momento.

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | identificador |
| lead_id | uuid | referência |
| version | integer | versão |
| stage | text | estágio da conversa |
| strategy_json | jsonb | estratégia |
| generated_from_turn_id | uuid | origem |
| created_at | timestamptz | criação |

### Conteúdo típico de `strategy_json`
- tone
- message_length
- proof_type
- offer_pattern
- cta_type
- best_move
- risks
- do_not_do

---

## 10. Tabela: reply_recommendations

Armazena respostas sugeridas.

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | identificador |
| lead_id | uuid | referência |
| turn_id | uuid | turno que motivou |
| reply_text | text | resposta sugerida |
| reply_json | jsonb | versão estruturada |
| model_name | text | modelo utilizado |
| created_at | timestamptz | criação |

---

## 11. Tabela: domain_rules

Representa regras de negócio editáveis.

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | identificador |
| rule_key | text | nome da regra |
| rule_type | text | prompt, threshold, policy, behavior |
| rule_json | jsonb | conteúdo |
| is_active | boolean | ativo |
| created_at | timestamptz | criação |
| updated_at | timestamptz | atualização |

### Exemplos
- limiar de promoção de hipótese para fato
- tipos de CTA permitidos
- textos proibidos
- intensidade de urgência aceitável

---

## 12. Tabela: audit_events

Registra tudo o que for importante para auditoria.

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | identificador |
| lead_id | uuid | referência |
| event_type | text | tipo |
| payload_json | jsonb | detalhes |
| created_at | timestamptz | criação |

### Exemplos de `event_type`
- turn_ingested
- signal_extracted
- memory_promoted
- memory_retracted
- persona_recomputed
- strategy_recomputed
- reply_generated

---

## 13. Estrutura mínima de snapshot

Exemplo de snapshot compacto a ser persistido e exposto:

```json
{
  "lead_id": "lead_123",
  "snapshot_version": 5,
  "stage": "OBJECTION_HANDLING",
  "temperature": "warm",
  "persona": {
    "analytical": 0.74,
    "price_sensitivity": 0.68,
    "trust_gap": 0.57,
    "decision_speed": 0.31,
    "directness": 0.82
  },
  "state": {
    "main_objection": "price",
    "purchase_intent": 0.77,
    "ghosting_risk": 0.24,
    "emotion": "curious_but_cautious"
  },
  "preferences": {
    "message_length": "short_structured",
    "formats": ["comparison", "proof", "summary"]
  },
  "strategy": {
    "tone": "consultive_direct",
    "best_move": "justify_value_then_offer_two_options",
    "cta": "advance_softly"
  }
}
```

## 14. Banco recomendado
Para um projeto pessoal ou MVP sólido:

### Banco principal
PostgreSQL

Motivos:

- maduro
- rápido
- jsonb útil
- índices bons
- suporta crescer
- funciona bem com dados estruturados e semiestruturados
### Cache
Redis

Motivos:

- excelente para hot memory
- rápido para snapshots
- útil para expiração por TTL
### Vetor opcional
pgvector se você quiser retrieval semântico no futuro.

## 15. Modelagem simples para começar rápido
Se quiser iniciar com o mínimo absoluto, crie primeiro só estas tabelas:

- leads
- turns
- memory_items
- persona_snapshots
- strategy_snapshots
Depois acrescente:

- signals
- reply_recommendations
- audit_events
## 16. Regras práticas de modelagem
### Faça
- use UUID
- use timestamptz
- use jsonb para campos flexíveis
- crie índices nos fluxos quentes
- separe fatos de inferências temporais
### Evite
- uma tabela genérica para tudo
- sobrescrever histórico
- guardar só texto livre
- apagar fato retraído sem rastreio
## 17. Resumo final
A modelagem ideal para este projeto é simples:

- histórico bruto fica salvo
- sinais ficam rastreáveis
- memória fica tipada
- persona e estratégia ficam versionadas
- respostas sugeridas ficam auditáveis
