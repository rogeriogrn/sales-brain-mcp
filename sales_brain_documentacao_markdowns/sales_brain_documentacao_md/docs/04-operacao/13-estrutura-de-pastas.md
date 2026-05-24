# 13. Estrutura de Pastas
## Objetivo
Propor uma estrutura de projeto que seja simples, legível e fácil de manter.

## 1. Estrutura sugerida
```text
sales-brain/
  README.md
```bash
  .env.example
  docker-compose.yml
  Dockerfile
```

```
  docs/
    01-blueprint-minimalista.md
    02-escopo-funcional.md
    03-modelagem-de-dados.md
    04-arquitetura-backend.md
    05-api-e-webhooks.md
    06-autenticacao-e-seguranca.md
    07-memory-persona-engine.md
    08-rag-e-economia-de-tokens.md
    09-mcp-adapter.md
    10-infra-env-docker.md
    11-readme-pessoal.md
    12-roadmap-mvp.md
    13-estrutura-de-pastas.md
    14-payloads-e-exemplos.md
    15-regras-de-negocio-e-comportamento.md

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
      behaviors/
      scoring/
      policies/
      rules/
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
      utils/
      types/

```
  tests/
    unit/
    integration/
## 2. Explicação por pasta
docs/
Documentação do projeto.

src/app/
Camada HTTP:

- rotas
- controllers
- middleware
- src/services/
Casos de uso e orquestração.

src/domain/
Regras do negócio e inteligência do produto.

src/repositories/
Acesso a banco e cache.

src/mcp/
Adapter de integração com MCP.

src/shared/
Tipos, utilitários, config e infraestrutura compartilhada.

tests/
Testes unitários e de integração.

## 3. Vantagem dessa estrutura
separa bem responsabilidades
evita acoplamento cedo
ajuda a crescer sem caos
facilita testes
deixa claro onde cada coisa mora
## 4. O que evitar na estrutura
### Evite
- uma pasta utils com tudo misturado
- lógica de domínio em controllers
- regra comercial no middleware
- queries SQL espalhadas pela aplicação
- lógica MCP duplicada fora do core
## 5. Ordem de criação prática
Você não precisa criar tudo de uma vez.

Comece criando:
- src/app
- src/services
- src/repositories
- src/shared
Depois acrescente:
- src/domain
- src/mcp
- tests
## 6. Resumo
A melhor estrutura é a que deixa evidente:

- entrada
- processamento
- regra
- persistência
- adaptação MCP
