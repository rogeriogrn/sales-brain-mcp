# 01. Blueprint Minimalista

## Visão geral

Este projeto não precisa nascer como uma plataforma gigante.
Ele pode começar como um **núcleo enxuto de inteligência comercial conversacional**, com foco em:

- receber trechos de conversa
- interpretar o comportamento do lead
- atualizar uma memória estruturada
- recalcular uma persona viva
- devolver estratégia e resposta sugerida

A proposta do blueprint minimalista é documentar o suficiente para construir com clareza, sem burocracia excessiva.

---

## 1. Problema que o sistema resolve

Hoje, a maior parte dos agents ou operadores:

- responde sem contexto profundo
- esquece o histórico real do cliente
- não diferencia comportamento de compra
- gasta tokens enviando conversa inteira
- muda de tom sem consistência
- não mantém memória comercial acionável

O sistema proposto resolve isso criando uma camada intermediária que:

- estrutura o histórico
- identifica sinais úteis
- atualiza perfil de compra
- resume o estado do lead
- orienta o agent em tempo real

---

## 2. Objetivo principal

Criar uma **API de inteligência comercial** que possa ser usada por qualquer agent com conexão MCP, para que esse agent sempre responda de acordo com:

- o perfil comportamental do cliente
- o estágio da conversa
- as objeções ativas
- a necessidade de confiança
- a sensibilidade a preço
- o formato de resposta ideal

---

## 3. Escopo escrito do MVP

### O sistema precisa:

## 1. receber um turno de conversa
## 2. salvar o turno no banco
## 3. extrair sinais do texto
## 4. atualizar memória quente do lead
## 5. atualizar fatos estáveis quando houver evidência
## 6. retrair fatos quando houver contradição
## 7. recalcular a persona do lead
## 8. recalcular a estratégia comercial
## 9. gerar um snapshot compacto
## 10. disponibilizar isso via API
## 11. disponibilizar isso via MCP
## 12. sugerir uma resposta alinhada ao perfil do lead

---

## 4. O que o MVP não precisa

Para a primeira versão, o sistema **não precisa**:

- dashboard complexo
- analytics avançado
- múltiplos níveis de permissão
- CRM completo
- múltiplos canais de comunicação
- automação de envio real
- motor de billing
- workflow builder visual
- orquestração pesada entre dezenas de agentes

---

## 5. Resultado esperado do MVP

Ao final de cada turno, o sistema deve conseguir devolver algo como:

- quem é esse lead em termos comerciais
- como ele costuma decidir
- qual a objeção dominante
- qual a melhor forma de falar com ele agora
- qual a próxima melhor ação
- qual resposta o agent deveria usar

---

## 6. Princípio arquitetural

A arquitetura deve seguir esta lógica:

### Core primeiro
Toda a lógica relevante mora em serviços internos do projeto.

### MCP depois
MCP é a camada de compatibilidade para agent.

### Prompt por último
O prompt não deve carregar toda a inteligência; ele só aplica uma inteligência já calculada.

---

## 7. Entidades mínimas do sistema

Mesmo no modo minimalista, o sistema precisa lidar com algumas entidades claras:

- lead
- conversa
- turno
- memória quente
- fatos estáveis
- fatos retraídos
- persona
- estratégia
- snapshot
- resposta sugerida
- evento de auditoria

---

## 8. Fluxo mínimo de funcionamento

### Passo 1
O host ou agent envia um novo turno da conversa.

### Passo 2
O backend salva esse turno.

### Passo 3
O sistema extrai sinais comportamentais e comerciais.

### Passo 4
A memória do lead é atualizada.

### Passo 5
A persona é recalculada.

### Passo 6
A estratégia é recalculada.

### Passo 7
O snapshot compacto é gerado.

### Passo 8
O agent consome o snapshot e responde melhor.

---

## 9. Decisão de engenharia principal

A escolha mais importante do projeto é esta:

### Não usar a conversa bruta como memória principal

Em vez disso, usar:

- fatos estruturados
- scores de persona
- memória quente resumida
- arquivo de histórico para recall

Isso reduz token e aumenta previsibilidade.

---

## 10. Critérios de sucesso do MVP

O MVP está funcionando quando:

- é fácil instalar
- a API responde rápido
- o snapshot do lead é pequeno
- a persona muda conforme o histórico
- o agent responde com mais consistência
- o custo de token cai em comparação com contexto bruto

---

## 11. Blueprint resumido em uma frase

> Um cérebro comercial externo, com memória estruturada e persona dinâmica, plugável via MCP em qualquer agent compatível.
