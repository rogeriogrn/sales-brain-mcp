# 04. Arquitetura Backend
## Objetivo
Descrever uma arquitetura backend simples, prática e escalável o suficiente para o projeto.

O foco não é construir microserviços complexos cedo demais.
O foco é ter um backend organizado em módulos claros, com responsabilidades bem separadas.

## 1. Princípio central
A lógica deve ser API-first.

Isso significa:

- primeiro se define o core do domínio
- depois se define a API
- por fim se expõe isso via MCP
O MCP é uma adaptação da lógica, não o núcleo da lógica.

## 2. Macroarquitetura
O backend pode ser organizado em 5 camadas:

- API Layer
- Application Services
- Domain Logic
- Persistence Layer
- MCP Adapter
## 3. API Layer
Essa camada recebe chamadas externas e valida payloads.

### Responsabilidades
- autenticação por API key
- validação de entrada
- padronização de erros
- serialização de resposta
- observabilidade básica
### Exemplos de rotas
- POST /v1/turns/ingest
- GET /v1/leads/:leadId/snapshot
- POST /v1/leads/:leadId/facts/upsert
- POST /v1/leads/:leadId/facts/retract
- POST /v1/leads/:leadId/recompute
- POST /v1/leads/:leadId/reply/recommend
## 4. Application Services
São os orquestradores dos casos de uso.

### Serviços principais
- TurnIngestionService
- SignalExtractionService
- MemoryService
- PersonaService
- StrategyService
- ReplyService
- SnapshotService
- AuditService
### Exemplo de fluxo orquestrado
TurnIngestionService:

- valida turno
- salva turno
- extrai sinais
- atualiza memória
- recalcula persona
- recalcula estratégia
- atualiza snapshot
- escreve auditoria
- devolve resposta consolidada
## 5. Domain Logic
Aqui fica a inteligência do produto.

### Exemplos de regras
- como promover hipótese para fato
- como reduzir peso de urgência ao longo do tempo
- como tratar contradição
- como mapear sinais em traços de persona
- como escolher o melhor tom
- como escolher o formato ideal da resposta
- quando evitar pressão
- quando priorizar prova social
### Regra importante
A maior parte da inteligência deve ficar aqui, e não no prompt do LLM.

## 6. Persistence Layer
### Componentes
- repositórios SQL
- cache Redis
- acesso opcional a embeddings/recall
- logs e auditoria
### Repositórios principais
- LeadRepository
- TurnRepository
- MemoryRepository
- PersonaRepository
- StrategyRepository
- ReplyRepository
- AuditRepository
## 7. MCP Adapter
Essa camada traduz a lógica do core para o protocolo MCP.

### O que faz
- expõe tools
- expõe resources
- opcionalmente expõe prompts
- autentica o consumidor
- resolve requests do protocol para chamadas internas
### O que não deve fazer
- reimplementar regras de negócio
- decidir sozinho toda a estratégia
- se tornar o banco de dados do sistema
## 8. Modelo sugerido de módulos
```text
src/
  app/
    routes/
    controllers/
    middleware/
  services/
    turn-ingestion/
    signal-extraction/
    memory/
    persona/
    strategy/
    reply/
    snapshot/
    audit/
  domain/
    scoring/
    behaviors/
    policies/
    classifiers/
  repositories/
    postgres/
    redis/
  mcp/
    server/
    tools/
    resources/
    prompts/
  shared/
    config/
    logger/
    errors/
    types/
```
## 9. Fluxo backend completo
### Ingestão de turno
- recebe payload
- autentica requisição
- valida estrutura
- cria ou localiza lead
- cria ou localiza conversa
- salva turno com idempotência
- extrai sinais
- atualiza memória
- recalcula persona
- recalcula estratégia
- atualiza snapshot
- salva auditoria
- devolve snapshot e recomendação
## 10. Separação de síncrono e assíncrono
Para começar, o sistema pode ser quase todo síncrono.
Mas já é bom pensar no que pode virar assíncrono depois.

### Síncrono no MVP
- salvar turno
- atualizar memória quente
- recalcular snapshot
- devolver resposta curta
### Assíncrono no futuro
- sumarização longa
- embeddings
- analytics
- reprocessamento completo
- recalibração em massa
## 11. Estado quente vs estado persistido
### Estado quente
Fica em Redis ou memória:

- snapshot recente
- estágio atual
- hot memory
- respostas rápidas
### Estado persistido
Fica em Postgres:

- turnos
- memória estruturada
- versões de persona
- versões de estratégia
- auditoria
## 12. Estratégia de versionamento
Toda mudança relevante no snapshot deve gerar:

- incremento de versão
- timestamp
- origem do turno base
Isso facilita:

- debug
- comparação
- rollback lógico
- replay
## 13. Idempotência
turn_id deve ser único.

Se o mesmo turno chegar duas vezes:

- não deve ser salvo duas vezes
- a atualização não deve ser duplicada
Isso é obrigatório para robustez.

## 14. Observabilidade mínima
Mesmo em projeto pessoal, registre:

- requisições recebidas
- erros de validação
- latência por endpoint
- falhas de banco
- falhas de modelo
- eventos de recomputação
## 15. Stack sugerida
Opção prática e rápida
Node.js com TypeScript
Fastify
PostgreSQL
Redis
### Motivos
- bom ecossistema
- ótimo para APIs
- boa produtividade
- boa compatibilidade com MCP
- Alternativa
- Python com FastAPI
- PostgreSQL
- Redis
Boa se você preferir Python para regras e NLP.

## 16. Recomendação final
Para este projeto, a melhor decisão é:

- começar modular, mas não excessivamente distribuído
- tratar como monólito bem organizado
- expor API simples
- adicionar MCP como adaptador fino
Isso entrega velocidade sem virar bagunça.
