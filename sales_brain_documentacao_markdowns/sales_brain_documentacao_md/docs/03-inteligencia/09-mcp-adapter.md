# 09. MCP Adapter
## Objetivo
Definir como a API do projeto deve ser exposta para agents que já suportam MCP, mantendo a lógica no core e o MCP como camada fina.

## 1. Papel do MCP no projeto
O MCP não é o cérebro.
O MCP é o adaptador padrão para que um agent se conecte com o cérebro do projeto.

## 2. Princípio de arquitetura
### Faça
- core API separado
- MCP traduz chamadas para a API interna
- resources para leitura
- tools para mutação
- Não faça
- lógica de negócio gigante dentro das tools
- múltiplas fontes de verdade
- persona calculada apenas no prompt
## 3. Estrutura conceitual
### Tools
Servem para ações.

### Resources
Servem para leitura de contexto.

### Prompts
Servem para guias ou templates auxiliares.

## 4. Tools mínimas
ingest_turn
Recebe um turno de conversa e aciona o pipeline principal.

get_snapshot
Retorna o snapshot atual do lead.

upsert_fact
Insere ou atualiza um fato.

retract_fact
Retrai um fato inválido.

recompute_persona
Força recomputação da persona.

get_next_best_action
Retorna a ação comercial recomendada.

recommend_reply
Retorna uma resposta sugerida.

## 5. Resources mínimas
lead://{id}/snapshot
Snapshot compacto.

lead://{id}/persona
Persona estruturada.

lead://{id}/memory/hot
Memória quente.

lead://{id}/strategy
Estratégia atual.

lead://{id}/objections
Objeções ativas e históricas.

## 6. Prompts opcionais
Use prompts apenas para apoio.

### Exemplos
- respond_consultively
- recover_cold_lead
- price_objection_playbook
- close_with_low_pressure
## 7. Fluxo recomendado do agent
Passo 1
Ler lead://id/snapshot

Passo 2
Ler lead://id/memory/hot se necessário

Passo 3
Analisar a nova mensagem

Passo 4
Chamar recommend_reply

Passo 5
Responder

Passo 6
Registrar novo turno com ingest_turn

## 8. Fluxo alternativo mais robusto
Antes de responder
ingest_turn
get_snapshot
get_next_best_action
recommend_reply
Isso garante que a resposta já use o estado recalculado.

## 9. Formato de tool: ingest_turn
Input exemplo
```json
{
  "turn_id": "turn_001",
  "lead_external_id": "lead_ext_123",
  "lead_name": "Carlos",
  "conversation_external_id": "conv_abc",
  "role": "user",
  "content": "quanto fica no pix e tem garantia?",
  "timestamp": "2025-01-15T20:11:00Z",
  "metadata": {
    "source_app": "sales-panel"
  }
}
```
Output exemplo
```json
{
  "ok": true,
  "lead_id": "uuid",
  "snapshot_version": 9,
  "stage": "OBJECTION_HANDLING"
}
```
## 10. Formato de resource: snapshot
### Exemplo
```json
{
  "lead_id": "uuid",
  "snapshot_version": 9,
  "stage": "OBJECTION_HANDLING",
  "temperature": "warm",
  "persona": {
    "analytical": 0.72,
    "price_sensitivity": 0.78,
    "trust_gap": 0.66
  },
  "state": {
    "main_objection": "price",
    "purchase_intent": 0.75
  },
  "strategy": {
    "tone": "consultive_direct",
    "best_move": "answer_price_with_value_and_reassurance"
  }
}
```
## 11. Comportamento ideal do adapter
O adapter deve ser fino.

Ele deve:
- autenticar
- validar payload MCP
- traduzir para chamadas internas
- devolver resposta padronizada
Ele não deve:
- fazer scoring avançado sozinho
- persistir fora do core
- divergir do domínio central
## 12. Instalação
Tenha dois modos:

### Local
MCP via STDIO
Bom para testes e integração local.

### Remoto
MCP via HTTP
Bom para SaaS e agents distribuídos.

## 13. Estratégia de compatibilidade
O melhor desenho é:

- API interna estável
- MCP adapter pequeno
- SDK futuro opcional
Assim, se um consumidor não quiser usar MCP, ainda pode usar a API.

## 14. Observabilidade no MCP
Registrar:

- tool chamada
- duração
- erro
- lead_id afetado
- versão do snapshot retornado
## 15. Segurança no MCP
Mesmo via MCP:

- valide API key
- limite acesso
- proteja resources sensíveis
- não exponha secrets em outputs
## 16. Resumo final
O MCP deve ser tratado como um conector universal, não como o núcleo do produto.

O verdadeiro valor está no core:

- memória
- persona
- estratégia
- snapshot
