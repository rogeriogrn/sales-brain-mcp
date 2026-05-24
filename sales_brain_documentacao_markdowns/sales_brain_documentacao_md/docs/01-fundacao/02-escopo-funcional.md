# 02. Escopo Funcional

## Objetivo

Definir de forma clara tudo o que o sistema faz, o que ele não faz e quais funcionalidades entram no MVP, na V1 e nas versões futuras.

---

## 1. Funcionalidades centrais

### 1.1 Ingestão de turnos de conversa
O sistema deve receber cada novo turno da conversa com informações como:

- lead_id
- role
- texto
- timestamp
- metadados opcionais

### 1.2 Persistência do histórico
Todo turno recebido deve ser salvo para permitir:

- rastreabilidade
- auditoria
- replay
- reprocessamento
- recalibração futura

### 1.3 Extração de sinais
A cada turno, o sistema deve inferir sinais úteis, como:

- intenção de compra
- urgência
- sensibilidade a preço
- necessidade de prova social
- necessidade de confiança
- estilo de comunicação
- risco de sumiço
- tom emocional provável

### 1.4 Memória viva do lead
O sistema deve manter um estado atualizado com:

- assunto atual
- etapa da conversa
- objeção ativa
- última pergunta pendente
- emoção provável do momento
- estratégia atual

### 1.5 Perfil estrutural do lead
O sistema deve manter uma representação persistente do perfil de compra:

- analítico vs emocional
- rápido vs lento na decisão
- alta vs baixa sensibilidade a preço
- necessidade de validação
- tolerância a pressão
- formato de resposta preferido

### 1.6 Geração de estratégia comercial
O sistema deve conseguir devolver recomendações como:

- melhor tom de resposta
- tamanho ideal da mensagem
- tipo de prova mais adequada
- CTA mais apropriado
- próxima melhor ação

### 1.7 Geração de resposta sugerida
O sistema deve ser capaz de compor uma resposta coerente com:

- a última mensagem
- a persona atual
- a estratégia calculada
- as regras do negócio

### 1.8 Exposição via API
Tudo isso deve estar disponível em endpoints simples.

### 1.9 Exposição via MCP
As funções principais também devem ser expostas como tools/resources para agents já compatíveis com MCP.

---

## 2. Funcionalidades do MVP

### Entram no MVP
- ingestão de turnos
- armazenamento em banco
- extração básica de sinais
- memória quente
- fatos estáveis
- fatos retraídos
- snapshot compacto
- estratégia comercial básica
- resposta sugerida
- API protegida por API key
- MCP adapter com tools essenciais

### Não entram no MVP
- multi-tenant avançado
- painel administrativo completo
- analytics de equipe
- billing
- agentes múltiplos coordenados
- testes A/B automatizados
- classificações muito profundas por nicho
- treinamento supervisionado próprio

---

## 3. Funcionalidades desejáveis para V1

- caching forte
- classificação mais rica de objeções
- detecção de mudança de temperatura do lead
- melhor controle de confiança dos fatos
- ranking de ações recomendadas
- resources dinâmicos no MCP
- subscriptions para snapshot ao vivo
- prompts de apoio para diferentes estilos de venda

---

## 4. Funcionalidades para V2

- biblioteca de prova social por contexto
- recomendação de oferta por perfil
- ajuste por nicho
- avaliação de qualidade de resposta
- aprendizagem por histórico
- interface web de observação
- comparação entre estratégias

---

## 5. Entradas do sistema

O backend deve aceitar:

### Entrada principal
Um turno de conversa.

### Entradas complementares
- atualização manual de fatos
- retração manual de fatos
- inserção de metadados externos
- atualização de regras do negócio
- catálogo de ofertas
- políticas de resposta

---

## 6. Saídas do sistema

O sistema deve devolver:

- snapshot do lead
- persona atual
- memória quente
- estratégia atual
- resposta sugerida
- lista de sinais detectados
- recomendações de próxima ação

---

## 7. Restrições funcionais

### O sistema não deve:
- depender da conversa completa em todo turno
- depender exclusivamente de embeddings
- misturar fatos estáveis com emoção momentânea
- sobrescrever informação sem rastreabilidade
- tratar inferência probabilística como verdade absoluta

---

## 8. Critérios de aceitação do MVP

### Critério 1
Um novo turno pode ser ingerido e persistido com idempotência.

### Critério 2
A ingestão atualiza a memória viva do lead.

### Critério 3
A ingestão recalcula persona e estratégia.

### Critério 4
O snapshot pode ser lido com poucas centenas de tokens.

### Critério 5
O agent consegue responder usando snapshot + últimos turnos, sem precisar do histórico inteiro.

### Critério 6
É possível corrigir manualmente fatos errados.

---

## 9. Casos de uso principais

### Caso de uso 1: Conversa em andamento
O agent recebe uma nova mensagem do cliente e consulta o snapshot atualizado para responder.

### Caso de uso 2: Recuperação de contexto
Após um intervalo, o agent lê memória quente, persona e resumo recente para retomar a conversa sem reler tudo.

### Caso de uso 3: Correção humana
O operador percebe que o sistema interpretou algo errado e retrai ou atualiza um fato.

### Caso de uso 4: Personalização comercial
O agent identifica o perfil do lead e muda o tom da resposta.

---

## 10. Resumo final do escopo

O produto não é um chat.
O produto é uma **camada de inteligência de contexto comercial** que torna qualquer agent mais consistente, econômico e orientado a conversão.
