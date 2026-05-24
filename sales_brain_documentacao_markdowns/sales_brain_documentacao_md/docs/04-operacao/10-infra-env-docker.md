# 10. Infra, .env e Docker
## Objetivo
Definir uma infraestrutura simples, repetível e fácil de subir em ambiente local ou servidor.

## 1. Princípio central
Mesmo em projeto pessoal, duas coisas são obrigatórias:

- segredos fora do código
- execução reproduzível
## 2. Variáveis de ambiente
Crie um arquivo .env com algo como:

- APP_ENV=development
- PORT=3000
- API_KEY=dev-key-super-segura

DATABASE_URL=postgres://postgres:postgres@localhost:5432/sales_brain
REDIS_URL=redis://localhost:6379

OPENAI_API_KEY=coloque_sua_chave_aqui
LOG_LEVEL=debug

SNAPSHOT_CACHE_TTL_SEC=300
HOT_MEMORY_TTL_SEC=1800
DEFAULT_TIMEZONE=UTC
## 3. Arquivo .env.example
No repositório, mantenha um .env.example com placeholders, nunca com valores reais.

Exemplo:

- APP_ENV=development
- PORT=3000
- API_KEY=your_api_key_here
- DATABASE_URL=postgres://user:password@host:5432/dbname
- REDIS_URL=redis://host:6379
- OPENAI_API_KEY=your_model_key_here
- LOG_LEVEL=info
- SNAPSHOT_CACHE_TTL_SEC=300
- HOT_MEMORY_TTL_SEC=1800
- DEFAULT_TIMEZONE=UTC
## 4. Componentes mínimos de infra
### Obrigatórios
- aplicação backend
- PostgreSQL
- Redis
### Opcionais
- pgAdmin
- ferramenta de migrations
- observabilidade
- fila
## 5. Docker Compose recomendado
Um docker-compose.yml simples já resolve bem para desenvolvimento.

Serviços sugeridos
app
postgres
redis
## 6. Exemplo conceitual de docker-compose
version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: sales_brain
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    restart: unless-stopped
    ports:
      - "6379:6379"

volumes:
  pgdata:
## 7. Dockerfile conceitual
Exemplo simplificado:

- FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
## 8. Organização de segredos
Nunca faça
chave no código-fonte
chave hardcoded em testes públicos
credenciais no README
```
.env versionado
Faça
.env local ignorado pelo git
.env.example no repositório
variáveis de produção no provedor/servidor
```
## 9. .gitignore mínimo
Inclua:

```
.env
node_modules/
dist/
logs
cache
Exemplo:
```

```
node_modules/
dist/
.env
*.log
coverage/
```
## 10. Migrations
Mesmo em projeto pessoal, use migrations.

Motivos:

- reproduzibilidade
- histórico de schema
- facilidade ao subir em outro ambiente
## 11. Backup
Se os dados tiverem valor operacional:

- backup do Postgres
- periodicidade simples
- restauração testada ao menos uma vez
## 12. Ambientes
development
logs verbosos
dados locais
chave de desenvolvimento
staging
opcional
útil se houver testes reais
production
HTTPS
logs controlados
banco protegido
backup
## 13. Deploy simples
Para um projeto pessoal, opções razoáveis:

- VPS simples
- Render
- Railway
- Fly.io
- Docker em servidor próprio
## 14. Recomendação prática de infra
Se quiser simplicidade
backend Node
Postgres gerenciado ou container
Redis gerenciado ou container
deploy via Docker Compose
Se quiser zero fricção local
tudo via Docker Compose
## 15. Checklist mínimo de infra
```
 .env criado
 .env.example atualizado
 banco sobe
 redis sobe
 app conecta nos dois
 migrations rodam
 endpoint /health responde
 chave nunca está no código
```
## 16. Conclusão
Infra boa para projeto pessoal não precisa ser sofisticada.
Ela precisa ser previsível, segura e fácil de repetir.
