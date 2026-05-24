# 07. Memory & Persona Engine
## Objetivo
Descrever o coração do produto: o motor que transforma conversa em memória útil, perfil comportamental de compra e estratégia de ação.

## 1. Princípio central
O sistema não deve tratar conversa inteira como contexto principal.
Ele deve transformar conversa em estado estruturado.

O produto existe para responder 4 perguntas:

o que aconteceu agora?
o que é estável nesse lead?
o que já não vale mais?
como agir comercialmente a partir disso?
## 2. Memória em camadas
A memória deve ser dividida em 5 camadas.

### 2.1 Hot Memory
Representa o agora.

Exemplos:

- assunto atual
- objeção atual
- pergunta em aberto
- estágio atual
- emoção provável atual
- melhor ação do momento
### 2.2 Profile Memory
Representa traços relativamente persistentes.

Exemplos:

- perfil analítico
- alta sensibilidade a preço
- baixa tolerância a pressão
- preferência por texto curto
- necessidade forte de prova social
### 2.3 Canonical Facts
Representa fatos estáveis.

Exemplos:

- nome
- produto de interesse
- decisor
- cidade
- preferência de pagamento
- orçamento declarado
### 2.4 Archive Memory
Representa memória histórica condensada.

Exemplos:

- resumo de janelas antigas
- principais objeções anteriores
- argumentos que funcionaram
- mudanças de direção
### 2.5 Retracted Memory
Representa memória invalidada.

Exemplos:

- urgência desconfirmada
- interesse em plano premium abandonado
- objeção mal classificada corrigida
## 3. Ciclo da memória
Ao receber um turno:
- identificar sinais
- mapear sinais em hipóteses
- atualizar memória quente
- confirmar ou enfraquecer traços
- promover fatos
- retrair fatos contraditórios
- recalcular snapshot
## 4. Tipos de sinal
Linguagem
direto
prolixo
hesitante
assertivo
técnico
informal
emocional
racional
Comercial
intenção de compra
urgência
foco em preço
busca de prova
busca de comparação
medo de risco
Conversacional
sumiu e voltou
pede resumo
responde em blocos
evita detalhes
faz perguntas objetivas
## 5. Persona não é etiqueta única
Evite classificar o lead como "tipo A", "tipo B" apenas.

Use eixos com score.

### Eixos sugeridos
- directness
- analytical
- emotionality
- price_sensitivity
- trust_gap
- urgency
- decision_speed
- validation_need
- pressure_tolerance
- verbosity
- format_preference_short
- format_preference_comparison
- format_preference_proof
## 6. Exemplo de persona estruturada
```json
{
  "communication_profile": {
    "directness": 0.82,
    "verbosity": 0.34,
    "formality": 0.21,
    "emotionality": 0.29,
    "analytical": 0.77
  },
  "decision_profile": {
    "price_sensitivity": 0.74,
    "trust_gap": 0.63,
    "urgency": 0.46,
    "decision_speed": 0.31,
    "validation_need": 0.72
  },
  "response_preferences": {
    "short_text": 0.84,
    "comparison": 0.79,
    "proof": 0.68,
    "audio_like_style": 0.22
  }
}
```
## 7. Regras de promoção e retração
### Promoção
Uma hipótese vira traço estável quando:

- aparece mais de uma vez
- é coerente com outros sinais
- não há contradição relevante
- a confiança acumulada passa do limiar
### Retração
Um item deve ser retraído quando:

- o próprio lead contradiz
- o padrão muda de forma consistente
- o operador corrige manualmente
- a hipótese envelhece e não se confirma
## 8. Decaimento temporal
Nem toda informação deve durar igual.

### Decaimento rápido
- emoção atual
- urgência aparente
- clima do turno
### Decaimento médio
- estágio da conversa
- objeção ativa
- engajamento recente
### Decaimento lento
- estilo de decisão
- sensibilidade a preço
- tolerância a pressão
### Sem decaimento
- nome
- produto confirmado
- pagamento confirmado
- decisor identificado
## 9. Estratégia de scoring
Você pode usar um modelo simples de score incremental.

### Exemplo
Se o lead pergunta preço cedo:

- price_sensitivity += 0.10
Se pede comparação:

- analytical += 0.07
Se pede garantia:

- trust_gap += 0.12
Se some após preço:

- ghosting_risk += 0.15
- price_sensitivity += 0.06
Se responde com "quero fechar":

- purchase_intent += 0.25
- decision_speed += 0.08
## 10. Estágios da conversa
Use um state machine simples:

- DISCOVERY
- QUALIFICATION
- DIAGNOSIS
- VALUE_PROOF
- OFFER
- OBJECTION_HANDLING
- CLOSING
- FOLLOW_UP
- POST_SALE
### Regra
Não mudar de estágio por impulso de um único token.
Use evidência suficiente.

## 11. Snapshot compacto
O snapshot é a saída condensada que o agent realmente usa.

Deve conter:
- estágio
- temperatura
- traços mais relevantes
- objeção principal
- intenção atual
- risco de abandono
- estratégia atual
- preferências de formato
Deve evitar:
- história demais
- análise longa
- texto redundante
## 12. Temperatura do lead
Uma abstração útil:

- cold
- cool
- warm
- hot
### Critérios possíveis
- intenção
- frequência de resposta
- objetividade
- avanço de etapa
- quantidade de fricção
## 13. Explicabilidade
Cada score importante deve ter explicação.

Exemplo:

price_sensitivity: 0.78
evidências:
- perguntou preço no primeiro bloco
- pediu pix
- comparou com concorrente
- sumiu após proposta anterior
Isso ajuda debug e confiança.

## 14. Controle de confiança
Cada item relevante deve carregar:

- confidence
- source_type
- source_ref
- first_seen_at
- last_seen_at
## 15. Papel do LLM vs regras
Regras fazem melhor:
- limiares
- decaimento
- promoção
- retração
- consistência de estado
LLM faz melhor:
- interpretação semântica
- classificação contextual
- resumo de janela
- resposta final
- Combinação ideal
LLM interpreta; regras consolidam.

## 16. Resumo final
O Memory & Persona Engine é o cérebro do sistema.
Ele transforma conversa em estado utilizável.
Sem essa camada, o agent vira apenas um improvisador caro em tokens.
