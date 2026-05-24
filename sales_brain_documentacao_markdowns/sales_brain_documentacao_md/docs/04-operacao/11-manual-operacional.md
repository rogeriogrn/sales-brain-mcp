# 11. README Pessoal
## Objetivo
Este documento é o seu manual de sobrevivência futura.
Ele existe para responder rapidamente:

- como rodar
- o que configurar
- como testar
- o que a API espera
- como depurar o básico
## 1. O que este projeto faz
Este projeto cria um núcleo de inteligência comercial conversacional que:

- recebe turnos de conversa
- salva histórico
- monta uma memória do lead
- calcula persona viva
- devolve snapshot e resposta sugerida
- pode ser usado por agents via API ou MCP
## 2. Requisitos
Node.js ou Python, conforme implementação
PostgreSQL
Redis
arquivo .env
## 3. Variáveis de ambiente
Exemplo:

- APP_ENV=development
- PORT=3000
- API_KEY=dev-key-super-segura
- DATABASE_URL=postgres://postgres:postgres@localhost:5432/sales_brain
- REDIS_URL=redis://localhost:6379
- OPENAI_API_KEY=coloque_sua_chave_aqui
- LOG_LEVEL=debug
- SNAPSHOT_CACHE_TTL_SEC=300
- HOT_MEMORY_TTL_SEC=1800
- DEFAULT_TIMEZONE=UTC
## 4. Como rodar localmente
Com Docker
```bash
docker compose up --build
Sem Docker
subir PostgreSQL
subir Redis
instalar dependências
rodar migrations
iniciar aplicação
Exemplo Node:
```

```bash
npm install
npm run migrate
npm run dev
```
## 5. Health check
Teste:

```bash
curl http://localhost:3000/health
Resposta esperada:
```

```json
{
  "status": "ok"
}
```
## 6. Teste principal da API
Endpoint
POST /v1/turns/ingest

Curl
```bash
curl -X POST http://localhost:3000/v1/turns/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-key-super-segura" \
  -d '{
    "turn_id": "turn_001",
    "lead": {
      "external_id": "lead_ext_123",
      "name": "Carlos"
    },
    "conversation": {
      "external_id": "conv_abc",
      "channel": "custom-ui"
    },
    "message": {
      "role": "user",
      "content": "quanto fica no pix e tem garantia?",
      "content_type": "text",
      "timestamp": "2025-01-15T20:11:00Z"
    }
  }'
```
## 7. Payload esperado
### Estrutura mínima
```json
{
  "turn_id": "turn_001",
  "lead": {
    "external_id": "lead_ext_123",
    "name": "Carlos"
  },
  "conversation": {
    "external_id": "conv_abc",
    "channel": "custom-ui"
  },
  "message": {
    "role": "user",
    "content": "texto da mensagem",
    "content_type": "text",
    "timestamp": "2025-01-15T20:11:00Z"
  }
}
```
## 8. O que verificar se der erro
401
API key errada
header ausente
400
payload inválido
campo obrigatório ausente
409
turn_id duplicado ou conflito lógico
500
erro interno
falha de banco
falha do provedor de IA
erro de recomputação
## 9. Ordem mental do sistema
Quando um turno chega:

- salvar turno
- extrair sinais
- atualizar memória
- recalcular persona
- recalcular estratégia
- atualizar snapshot
- sugerir resposta
## 10. Onde olhar em caso de bug
logs da aplicação
tabela turns
tabela memory_items
tabela persona_snapshots
tabela strategy_snapshots
tabela audit_events
## 11. O que nunca esquecer
não colocar segredo no código
não confiar em histórico bruto como memória final
não deixar o agent responder sem snapshot
não sobrescrever fato sem rastrear
não misturar emoção momentânea com fato estável
## 12. Comandos úteis
Subir ambiente
```bash
docker compose up --build
Derrubar ambiente
docker compose down
Ver logs
docker compose logs -f app
Acessar banco
docker exec -it <container_postgres> psql -U postgres -d sales_brain
```
## 13. Lembrete operacional
Se o agent parecer "burro", normalmente o problema estará em um destes pontos:

- snapshot pobre
- memória quente desatualizada
- regra de estratégia mal calibrada
- payload do turno incompleto
- retração de fatos mal feita
## 14. Conclusão
Este README não é marketing.
Ele é a sua memória operacional.
Mantenha-o curto, prático e atualizado sempre que a estrutura mudar.
