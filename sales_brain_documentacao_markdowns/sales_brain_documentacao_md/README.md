# Sales Brain MCP: Documentação do Projeto

Documentação reorganizada em arquivos Markdown separados para facilitar leitura, manutenção, implementação e consulta por agents.

## Objetivo do pacote

Este pacote documenta um sistema de inteligência comercial conversacional com memória estruturada, persona dinâmica, API-first e camada MCP.

A documentação foi separada por responsabilidade para reduzir confusão durante desenvolvimento, revisão técnica e uso por agentes.

## Estrutura principal

```text
sales_brain_documentacao_md/
  README.md
  docs/
    00-indice-geral.md
    01-fundacao/
    02-backend-api/
    03-inteligencia/
    04-operacao/
    05-referencia/
```

## Ordem recomendada de leitura

1. `docs/00-indice-geral.md`
2. `docs/01-fundacao/01-blueprint-minimalista.md`
3. `docs/01-fundacao/02-escopo-funcional.md`
4. `docs/01-fundacao/03-modelagem-de-dados.md`
5. `docs/02-backend-api/04-arquitetura-backend.md`
6. `docs/03-inteligencia/07-memory-persona-engine.md`
7. `docs/03-inteligencia/09-mcp-adapter.md`
8. `docs/04-operacao/12-roadmap-mvp.md`
9. `docs/05-referencia/14-payloads-e-exemplos.md`
10. `docs/05-referencia/15-regras-de-negocio-e-comportamento.md`

## Como usar com um agent

Use o índice geral como ponto de entrada. Depois, carregue apenas o arquivo específico que o agent precisa analisar.

Exemplos:

- Para arquitetura: use `04-arquitetura-backend.md`
- Para API: use `05-api-e-webhooks.md`
- Para memória e persona: use `07-memory-persona-engine.md`
- Para payloads: use `14-payloads-e-exemplos.md`
- Para regras comerciais: use `15-regras-de-negocio-e-comportamento.md`

## Decisão de organização

A documentação foi organizada por domínio técnico:

- Fundação: visão, escopo e dados
- Backend e API: arquitetura, endpoints e segurança
- Inteligência: memória, persona, RAG e MCP
- Operação: infra, manual, roadmap e pastas
- Referência: payloads, exemplos e regras de negócio
