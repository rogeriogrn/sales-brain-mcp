# 06. Autenticação e Segurança
## Objetivo
Definir uma estratégia de autenticação e segurança compatível com um projeto pessoal, MVP ou uso restrito, sem burocracia desnecessária, mas sem negligência.

## 1. Princípio central
Se só você ou poucos sistemas seus vão usar, não comece com login complexo.
Comece com algo simples, controlado e suficientemente seguro para o contexto.

## 2. Autenticação recomendada para o início
API Key estática por ambiente
A forma mais simples:

- gerar uma chave forte
- guardar em .env
- exigir no cabeçalho de toda requisição protegida
### Exemplo
- x-api-key: dev-key-super-segura

## 3. Quando isso é suficiente
API Key simples é suficiente quando:

- o sistema é pessoal
- uso é restrito
- poucos clientes internos consomem a API
- não existe painel público
- não há múltiplos usuários finais
## 4. Quando isso deixa de ser suficiente
Você deve evoluir para algo melhor quando houver:

- múltiplos usuários
- multi-tenant
- painel web com login
- revogação granular
- auditoria por usuário
- permissões por recurso
## 5. Segurança mínima obrigatória
Mesmo em projeto pessoal:

### Faça
- use .env
- nunca comite chaves
- valide entrada
- registre erros
- limite acesso externo
- use HTTPS em produção
- proteja o banco
- aplique timeouts
### Evite
- chave no código
- credenciais expostas em README
- rota sem proteção
- logs vazando segredo
- acesso irrestrito ao banco
## 6. Variáveis sensíveis
Itens que devem ficar em .env:

- API_KEY
- DATABASE_URL
- REDIS_URL
- OPENAI_API_KEY ou equivalente
- JWT_SECRET se um dia existir
- LOG_LEVEL
- APP_ENV
## 7. Middleware simples de autenticação
A lógica pode ser:

- ler x-api-key
- comparar com valor do ambiente
- se diferente, retornar 401
- se válido, seguir a requisição
Isso é suficiente no MVP.

## 8. Rate limit
Mesmo em sistema pessoal, vale ter rate limit mínimo para evitar abuso acidental.

### Exemplo
- 60 requests por minuto por IP
- ou 300 por minuto por chave
## 9. Segurança de payload
Toda entrada deve ser validada.

### Itens obrigatórios
- tipos corretos
- tamanho máximo de texto
- enum válido
- campos mínimos presentes
- Exemplo de limites úteis
- conteúdo textual com tamanho máximo
- metadata_json limitado
- número máximo de itens em arrays
## 10. Proteção contra duplicidade
A segurança lógica também envolve consistência.

turn_id único
Evita:

- reprocessamento duplicado
- corrupção do histórico
- custo desnecessário
## 11. Proteção contra prompt injection operacional
Mesmo que o agent receba mensagens do cliente, o sistema deve distinguir:

- conteúdo do cliente
- fatos estruturados
- regras do negócio
- estratégia do sistema
Nunca tratar texto bruto do cliente como instrução confiável do sistema.

## 12. Segregação de confiança
### Baixa confiança
- emoções inferidas
- estilo momentâneo
- urgência do turno
### Média confiança
- padrão recorrente de comportamento
- objeções repetidas
- preferência de formato
### Alta confiança
- nome
- produto escolhido
- forma de pagamento confirmada
- fato manualmente validado
## 13. Logs e segredos
### Regras
- não logar API keys
- não logar tokens completos
- mascarar dados sensíveis
- registrar apenas o necessário
### Exemplo
Em vez de:

Authorization: Bearer abcdef123456789...
Registrar:

Authorization: Bearer ****789
## 14. Produção mínima segura
Se for subir em produção:

- use HTTPS
- restrinja origem se possível
- proteja banco por rede privada
- rode com variáveis seguras
- faça backup do Postgres
- tenha rotação de logs
- monitore falhas
## 15. Evolução futura de autenticação
Quando o projeto crescer, considere:

- API keys por consumidor
- expiração de chave
- escopos por chave
- OAuth para integrações
- JWT para painel
- auditoria por usuário
## 16. Resumo operacional
### Fase inicial
API Key em header + .env + validação forte

### Fase intermediária
API keys por cliente + rate limit + auditoria melhor

### Fase madura
Auth por usuário, tenant e escopo

## 17. Conclusão
Para este projeto, autenticação simples é a melhor escolha no começo.
Mas simplicidade não significa descuido.
A base correta é:

- segredo no .env
- middleware curto
- validação forte
- logs limpos
- HTTPS em produção
