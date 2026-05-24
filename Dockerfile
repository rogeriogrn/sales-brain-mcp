# Estágio 1: Compilação e Geração de Código
FROM node:20-alpine AS builder

WORKDIR /app

# Copia manifestos de dependências
COPY package*.json ./

# Instala todas as dependências (incluindo devDependencies de compilação)
RUN npm ci

# Copia o restante do código-fonte do projeto
COPY . .

# Gera os tipos estáticos do Prisma Client baseados no schema.prisma
RUN npx prisma generate

# Compila o código TypeScript para Javascript nativo (dist/)
RUN npm run build

# Estágio 2: Ambiente de Execução Leve
FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Define variáveis de ambiente de produção
ENV NODE_ENV=production
ENV PORT=3000

# Copia manifestos
COPY package*.json ./

# Instala apenas dependências de produção para reduzir a imagem final
RUN npm ci --only=production

# Copia os artefatos compilados e estáticos do estágio anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Expõe a porta padrão do servidor Fastify
EXPOSE 3000

# Executa o servidor backend de produção
CMD ["node", "dist/app/index.js"]
