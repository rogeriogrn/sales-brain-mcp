# 🧠 Sales Brain MCP — Cérebro Comercial Conversacional

O **Sales Brain MCP** é um motor de inteligência comercial conversacional com **Memória Estruturada Relacional**, calibração comportamental de **Persona** em tempo real e geração de **Diretrizes de Prompt (Estratégia)** para IAs parceiras. 

Ele atua como um servidor oficial do **Model Context Protocol (MCP)**, expondo suas ferramentas e dados analíticos de forma nativa para IAs clientes (como o Claude Desktop ou fluxos do n8n) via Stdio ou Server-Sent Events (SSE), e conta com um **Painel de Controle Visual SPA de Luxo** no estilo **Minimalista Suíço**.

---

## 🎨 O Painel Administrativo Visual (SPA Swiss Premium)
O projeto inclui um painel de administração em tempo real de altíssimo padrão, servido diretamente na porta da aplicação. Ele dispensa setups complexos no frontend e se comunica com o seu banco relacional:
* **Playground Conversacional (Chat):** Envie mensagens simulando conversas com clientes e assista as análises acontecerem.
* **Radar comportamental da Persona:** Gráficos de eixos comportamentais calibram-se na hora.
* **Diretrizes de Prompt (Estratégia):** Visualização imediata do "Best Move", "Do Not Do" e "Tone Directives" que a IA parceira deve adotar.
* **Memória Viva do Lead:** Abas para monitorar Objeções Ativas (Hot Memory) e fatos estáveis confirmados (Profile).

---

## ⚡ 1. Instalação e Execução Local (Zero Fricção com SQLite)

A arquitetura local foi desenhada para rodar de forma autônoma e instantânea em qualquer máquina, sem a necessidade obrigatória de Docker ou bancos de dados externos.

### Passo 1: Clonar e Instalar as Dependências
Abra o seu terminal na pasta do projeto e instale as dependências:
```bash
npm install
```

### Passo 2: Configurar as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto (ou copie do `.env.example`). O arquivo de desenvolvimento vem pré-configurado por padrão:
```env
NODE_ENV=development
PORT=3000
API_KEY=dev-key-super-segura
DATABASE_URL=file:./dev.db
REDIS_URL=redis://localhost:6379
DEFAULT_TIMEZONE=UTC
SNAPSHOT_CACHE_TTL_SEC=300
HOT_MEMORY_TTL_SEC=1800
```
*(Nota: O cliente Redis integrado conta com um Fallback em memória RAM automático. Se você não possuir o Redis ativo localmente, a aplicação funcionará de forma perfeita e transparente em memória sem travar!).*

### Passo 3: Inicializar o Banco Relacional (SQLite)
Sincronize o schema físico do Prisma com o seu banco SQLite local (`dev.db`):
```bash
npx prisma db push
```

### Passo 4: Subir a Aplicação em Modo Desenvolvimento
Inicie o dev server com recarregamento dinâmico automático (Hot-Reload):
```bash
npm run dev
```
O console exibirá o sucesso da inicialização:
```text
[INFO] Server listening at http://0.0.0.0:3000
[INFO] 🚀 Servidor Sales Brain iniciado com sucesso em http://0.0.0.0:3000
```

### Passo 5: Acessar o Painel Visual
Acesse o seu navegador de preferência:
👉 **[http://localhost:3000/](http://localhost:3000/)**
*(Use a API Key `dev-key-super-segura` no campo superior se solicitado).*

---

## 🔌 2. Integração e Uso do MCP (Model Context Protocol)

O Sales Brain expõe três ferramentas fundamentais para IAs parceiras: `ingest_turn`, `get_lead_context` e `recommend_reply`.

### Opção A: Conexão Local via Claude Desktop (Stdio)
Abra a sua configuração do Claude Desktop (`%APPDATA%\Claude\claude_desktop_config.json` no Windows ou `~/Library/Application Support/Claude/claude_desktop_config.json` no macOS) e aponte para o arquivo executável MCP Stdio do projeto:

```json
{
  "mcpServers": {
    "sales-brain-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "tsx",
        "C:/caminho/para/seu/projeto/src/mcp-server.ts"
      ],
      "env": {
        "DATABASE_URL": "file:C:/caminho/para/seu/projeto/prisma/dev.db",
        "NODE_ENV": "development",
        "API_KEY": "dev-key-super-segura"
      }
    }
  }
}
```

### Opção B: Conexão via Rede / n8n (SSE - Server-Sent Events)
Se o seu fluxo do n8n (n8n Cloud ou VPS) ou outro agente em nuvem precisar se conectar ao seu Sales Brain local exposto (via ngrok/localtunnel) ou em produção na nuvem:
* **Stream SSE (GET):** `https://seu-dominio.com/v1/mcp/sse`
* **Mensagens JSON-RPC (POST):** `https://seu-dominio.com/v1/mcp/messages`

---

## ☁️ 3. Implantação Profissional em VPS (Produção)

Para hospedar o **Sales Brain MCP** em um servidor virtual privado (VPS) como DigitalOcean, Hetzner, AWS ou Google Cloud de forma robusta e definitiva em produção, você possui duas abordagens excelentes.

### 🐳 Abordagem 1: Docker Compose (Recomendada e Automatizada)

Esta é a melhor abordagem, pois sobe o banco de dados PostgreSQL de produção, o Redis de alta performance e a própria aplicação do Sales Brain de forma isolada, em rede segura e com apenas um comando.

#### Passo 1: Atualizar o arquivo `.env` para produção na VPS
Crie o `.env` na VPS definindo a string de conexão apontando para o container interno do PostgreSQL:
```env
NODE_ENV=production
PORT=3000
API_KEY=sua-chave-secreta-complexa-de-producao
DATABASE_URL=postgresql://postgres:postgres_senha_segura@postgres:5432/sales_brain?schema=public
REDIS_URL=redis://redis:6379
```

#### Passo 2: Subir a Orquestração
Certifique-se de ter o Docker e o Docker Compose instalados na VPS. Na pasta raiz do projeto, execute:
```bash
docker compose up -d --build
```
Este comando criará o banco de dados Postgres persistido em volume, o Redis, gerará o build da aplicação no Dockerfile multi-stage e iniciará os serviços em background de forma resiliente (`restart: unless-stopped`).

---

### 🟢 Abordagem 2: Instalação Nativa via PM2 & Nginx Proxy (Alta Costura DevOps)

Ideal para performance extrema sem o overhead de containers, utilizando o gerenciador de processos PM2 e o Nginx como proxy reverso com certificado SSL Let's Encrypt.

#### Passo 1: Instalar Node.js e Dependências na VPS (Ubuntu/Debian)
```bash
# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# Instalar PM2 Globalmente
sudo npm install -y pm2 -g
```

#### Passo 2: Instalar e Compilar o Projeto na VPS
Clone o repositório na VPS, configure o `.env` com a sua string de banco PostgreSQL de produção e execute:
```bash
npm install
npx prisma generate
npm run build
```

#### Passo 3: Rodar as Migrações de Produção no Postgres
```bash
npx prisma db push
```

#### Passo 4: Iniciar a Aplicação com o PM2
```bash
pm2 start dist/app/index.js --name "sales-brain"
pm2 save
pm2 startup
```
*(O PM2 garante que se a VPS reiniciar ou o processo cair, a aplicação voltará a rodar imediatamente em segundo plano).*

#### Passo 5: Configurar Nginx e SSL Grátis (Let's Encrypt)
Instale o Nginx e o Certbot:
```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

Crie um arquivo de configuração para o seu domínio no Nginx:
```bash
sudo nano /etc/nginx/sites-available/salesbrain
```
Cole a configuração do proxy reverso apontando para a porta 3000:
```nginx
server {
    listen 80;
    server_name seu-dominio.com; # Substitua pelo seu subdomínio/domínio configurado no DNS

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Suporte a Server-Sent Events (SSE) do MCP
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_read_timeout 24h;
    }
}
```

Ative a configuração e reinicie o Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/salesbrain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Gere o Certificado SSL SSL criptografado automático do Let's Encrypt:
```bash
sudo certbot --nginx -d seu-dominio.com
```
*Pronto! Agora você tem o Sales Brain rodando em HTTPS seguro (`https://seu-dominio.com`) para integrar de forma limpa e definitiva no n8n Cloud sem precisar de ngrok!*
