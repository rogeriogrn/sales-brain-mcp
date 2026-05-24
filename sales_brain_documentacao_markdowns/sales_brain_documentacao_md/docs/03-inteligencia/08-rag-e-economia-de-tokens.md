# 08. RAG e Economia de Tokens
## Objetivo
Definir como o sistema deve reduzir custo de contexto, sem perder qualidade de resposta.

## 1. Princípio central
O sistema não deve reenviar a conversa inteira ao modelo a cada turno.

Em vez disso, deve montar um contexto pequeno, usando:

- snapshot
- memória quente
- fatos estáveis
- últimos turnos
- retrieval seletivo
## 2. O erro comum
Muitos sistemas fazem isto:

- pegam todo o histórico
- jogam no prompt
- pedem para o modelo "lembrar"
Isso gera:

- alto custo
- latência maior
- inconsistência
- deriva de comportamento
- respostas menos previsíveis
## 3. Modelo recomendado
Use um RAG híbrido estruturado.

Camadas
Structured state
Summary memory
Recent turns
Semantic retrieval opcional
## 4. Structured state
É o mais importante e mais barato.

Inclui:

- estágio da conversa
- traços de persona
- objeção dominante
- estratégia atual
- preferências
- intenção e risco
Esse bloco é altamente informativo e pequeno.

## 5. Summary memory
É um resumo curto do histórico útil.

Exemplo:

- lead comparou opções
- mostrou preocupação com preço
- pediu garantia
- respondeu melhor a comparações curtas
- rejeitou pressão
## 6. Recent turns
Somente os últimos turnos necessários.

Recomendação:

- 4 a 10 turnos, dependendo do tamanho
- priorizar os mais recentes e relevantes
## 7. Retrieval semântico opcional
Embeddings devem ser usados com parcimônia.

### Bons usos
- buscar conversa antiga semelhante
- recuperar uma objeção recorrente
- achar prova social compatível
- localizar um resumo histórico útil
### Maus usos
- substituir o estado estruturado
- ser a única memória do lead
- decidir sozinho o que é verdade
## 8. O que enviar ao modelo por turno
### Contexto ideal
- instrução base curta
- snapshot compacto
- hot memory
- últimos turnos
- regra comercial relevante
- mensagem atual do cliente
### O que não enviar sempre
- histórico inteiro
- auditoria completa
- todas as versões de persona
- todas as regras do sistema
## 9. Estrutura ideal do snapshot para economia
Exemplo:

```json
{
  "lead_id": "123",
  "stage": "OFFER",
  "temperature": "warm",
  "persona": {
    "analytical": 0.74,
    "price_sensitivity": 0.71,
    "trust_gap": 0.58
  },
  "state": {
    "main_objection": "price",
    "purchase_intent": 0.80
  },
  "preferences": {
    "message_length": "short_structured",
    "formats": ["comparison", "proof"]
  },
  "strategy": {
    "tone": "consultive_direct",
    "best_move": "compare_two_options_then_soft_cta"
  }
}
```
Isso já é muito mais barato que mandar 100 mensagens anteriores.

## 10. Estratégia de resumo por janela
A cada X turnos, gere um resumo condensado.

Exemplo de janela
a cada 8 ou 12 turnos
ao encerrar estágio
ao detectar mudança importante
O resumo deve guardar
objetivo do lead
objeções
viradas de conversa
argumentos que funcionaram
pontos em aberto
## 11. Cache do snapshot
O snapshot deve ser cacheado.

Benefícios
baixa latência
menos leitura no banco
resposta rápida ao agent
### Ferramenta recomendada
Redis.

## 12. Estratégia de truncamento
Se o contexto estiver crescendo demais:

- manter snapshot
- manter hot memory
- manter mensagem atual
- manter últimos turnos
- retirar detalhes antigos já resumidos
## 13. Estratégia de compressão semântica
Em vez de manter:

- “o lead perguntou sobre preço no turno 3, 7 e 12”
Você pode consolidar em:

- “preço é uma objeção recorrente”
Esse tipo de compressão é o coração da economia de tokens.

## 14. Orçamento de contexto recomendado
No MVP, você pode mirar algo como:

- 250 a 600 tokens para snapshot + memória
- 150 a 800 tokens para últimos turnos
- 100 a 300 tokens para instrução curta
Isso tende a funcionar bem para respostas comerciais objetivas.

## 15. Heurística de recuperação
Antes de chamar o modelo, pergunte:

O agent precisa de histórico antigo?
Se não, não recupere.

O tema atual contradiz algo anterior?
Se sim, recupere o fato relevante.

O lead está retomando assunto antigo?
Se sim, recupere resumo da janela anterior.

## 16. Medidas que valem monitorar
tokens por turno
latência por turno
tamanho médio do snapshot
frequência de retrieval vetorial
taxa de uso de resumo vs histórico bruto
custo por conversa
## 17. Regra final
O sistema deve tratar o LLM como executor contextual, não como banco de memória.

Quanto mais contexto já vier estruturado, menor o custo e maior a consistência.
