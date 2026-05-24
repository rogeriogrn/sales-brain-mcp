# 12. Roadmap MVP
## Objetivo
Organizar a construção do projeto em fases executáveis, sem tentar fazer tudo ao mesmo tempo.

## 1. Estratégia de entrega
O melhor caminho é construir em camadas.

Ordem recomendada
persistência
ingestão
memória
persona
estratégia
resposta
MCP
## 2. Fase 0: Fundação
### Meta
Subir o esqueleto do projeto.

### Entregas
- estrutura de pastas
```
.env.example
Docker Compose
PostgreSQL
Redis
endpoint /health
autenticação por API key
Critério de pronto
A aplicação sobe e responde health check.
```

## 3. Fase 1: Ingestão e persistência
### Meta
Receber e salvar turnos com idempotência.

### Entregas
- POST /v1/turns/ingest
- criação/localização de lead
- criação/localização de conversa
- persistência em turns
- auditoria básica
### Critério de pronto
O sistema recebe um turno e o salva corretamente.

## 4. Fase 2: Memória estruturada
### Meta
Atualizar memória viva e fatos básicos.

### Entregas
- memory_items
- hot memory
- canonical facts
- retract de fatos
- regra de expiração
### Critério de pronto
Ao ingerir um turno, o sistema já atualiza memória útil.

## 5. Fase 3: Persona viva
### Meta
Calcular traços comerciais.

### Entregas
- eixos de persona
- scores iniciais
- promoção de hipótese
- retração por contradição
- persona_snapshots
### Critério de pronto
O lead passa a ter um perfil comercial estruturado.

## 6. Fase 4: Estratégia comercial
### Meta
Traduzir persona em ação.

### Entregas
- state machine de estágio
- best next action
- tom recomendado
- formato recomendado
- CTA recomendado
- strategy_snapshots
### Critério de pronto
O sistema passa a dizer como responder.

## 7. Fase 5: Resposta sugerida
### Meta
Gerar resposta adaptada.

### Entregas
- endpoint de recomendação
- uso de snapshot + últimos turnos
- regras de tom
- resposta curta e auditável
### Critério de pronto
O sistema devolve uma resposta útil e coerente.

## 8. Fase 6: MCP adapter
### Meta
Permitir plug rápido em agents compatíveis.

### Entregas
- tools mínimas
- resources mínimas
- autenticação MCP
- leitura de snapshot
### Critério de pronto
Um agent consegue consumir o estado do lead via MCP.

## 9. Fase 7: Otimização
### Meta
Reduzir custo e melhorar latência.

### Entregas
- cache de snapshot
- resumo por janela
- retrieval seletivo
- observabilidade melhor
- retry e robustez
### Critério de pronto
Tokens e tempo de resposta caem sem perda de qualidade.

## 10. Ordem de prioridade das features
### Prioridade máxima
- ingestão
- persistência
- memória
- snapshot
### Prioridade média
- persona
- estratégia
- resposta
### Prioridade posterior
- MCP avançado
- analytics
- fine tuning por nicho
## 11. Checklist de MVP real
 app sobe
 auth por API key funciona
 ingestão salva turnos
 lead é criado corretamente
 memória quente atualiza
 fatos podem ser retraídos
 persona é calculada
 estratégia é calculada
 snapshot é lido
 resposta é sugerida
 MCP lê snapshot
## 12. Riscos de execução
Risco 1
Tentar fazer o agente "inteligente demais" antes de organizar estado.

Risco 2
Jogar conversa inteira no prompt.

Risco 3
Criar abstrações demais cedo.

Risco 4
Não salvar evidência e depois não entender por que a persona mudou.

## 13. Meta do primeiro marco útil
O primeiro marco realmente valioso é este:

Dado um turno novo, o sistema consegue devolver um snapshot do lead e uma resposta sugerida melhor do que um agent responderia no escuro.

## 14. Conclusão
O roadmap ideal é incremental.
Primeiro se constrói memória e consistência.
Depois se adiciona sofisticação.
