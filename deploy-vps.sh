#!/bin/bash

# ==============================================================================
# SALES BRAIN MCP — SCRIPT DE DEPLOY AUTOMATIZADO PARA VPS (UBUNTU/DEBIAN)
# ==============================================================================
# Este script automatiza o setup completo da VPS: atualiza pacotes, instala
# Docker/Docker Compose, clona o repositório do GitHub, configura as variáveis
# de ambiente e inicia o Sales Brain de forma robusta e persistente.
# ==============================================================================

# Cores para formatação de logs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # Sem Cor

echo -e "${YELLOW}======================================================================${NC}"
echo -e "${GREEN}  🧠 INICIANDO INSTALAÇÃO AUTOMÁTICA DO SALES BRAIN MCP NA VPS${NC}"
echo -e "${YELLOW}======================================================================${NC}"

# 1. Atualizar repositórios e pacotes do sistema
echo -e "\n${YELLOW}[1/6] Atualizando pacotes do sistema...${NC}"
sudo apt update && sudo apt upgrade -y
sudo apt install curl git apt-transport-https ca-certificates gnupg lsb-release -y

# 2. Instalar Docker e Docker Compose se não estiverem presentes
echo -e "\n${YELLOW}[2/6] Verificando e instalando Docker & Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "Instalando Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo -e "${GREEN}✔ Docker instalado com sucesso.${NC}"
else
    echo -e "${GREEN}✔ Docker já está instalado.${NC}"
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "Instalando Docker Compose..."
    sudo apt install docker-compose-plugin -y
    echo -e "${GREEN}✔ Docker Compose instalado com sucesso.${NC}"
else
    echo -e "${GREEN}✔ Docker Compose já está instalado.${NC}"
fi

# 3. Clonar ou atualizar o repositório do Sales Brain
DEPLOY_DIR="/opt/sales-brain-mcp"
echo -e "\n${YELLOW}[3/6] Configurando diretórios e clonando o repositório GitHub...${NC}"

if [ -d "$DEPLOY_DIR" ]; then
    echo -e "Diretório antigo encontrado em $DEPLOY_DIR. Atualizando código via Git Pull..."
    cd "$DEPLOY_DIR"
    git reset --hard HEAD
    git pull origin main
else
    echo -e "Clonando repositório oficial na pasta $DEPLOY_DIR..."
    sudo git clone https://github.com/rogeriogrn/sales-brain-mcp.git "$DEPLOY_DIR"
    cd "$DEPLOY_DIR"
fi

# 4. Criar arquivo de variáveis de ambiente (.env) de produção
echo -e "\n${YELLOW}[4/6] Configurando variáveis de ambiente (.env)...${NC}"
ENV_FILE="$DEPLOY_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo -e "Criando arquivo .env de produção padrão..."
    sudo cp .env.example .env
    
    # Gerar uma API Key aleatória segura se o usuário quiser, ou usar uma padrão
    API_KEY_SECURE=$(openssl rand -hex 16)
    
    sudo sed -i 's/NODE_ENV=development/NODE_ENV=production/g' .env
    sudo sed -i "s/API_KEY=dev-key-super-segura/API_KEY=$API_KEY_SECURE/g" .env
    
    echo -e "${GREEN}✔ Arquivo .env criado com sucesso em $DEPLOY_DIR${NC}"
    echo -e "${GREEN}🔑 Sua API Key de Produção gerada é: ${YELLOW}$API_KEY_SECURE${NC}"
    echo -e "${YELLOW}Guarde essa chave em local seguro para configurar seus nós do n8n!${NC}"
else
    echo -e "${GREEN}✔ Arquivo .env já existe no diretório. Mantendo configurações antigas.${NC}"
fi

# 5. Iniciar containers com Docker Compose
echo -e "\n${YELLOW}[5/6] Subindo orquestração em containers (Database, Redis, Fastify)...${NC}"
cd "$DEPLOY_DIR"
sudo docker compose down &> /dev/null
sudo docker compose up -d --build

echo -e "${GREEN}✔ Containers iniciados com sucesso!${NC}"
sudo docker ps

# 6. Explicar exposição e setup de domínio
echo -e "\n${YELLOW}[6/6] Finalizando instalação...${NC}"
echo -e "${YELLOW}======================================================================${NC}"
echo -e "${GREEN}  🎉 INSTALAÇÃO CONCLUÍDA COM SUCESSO!${NC}"
echo -e "${YELLOW}======================================================================${NC}"
echo -e "\nO seu Sales Brain MCP está rodando na porta ${GREEN}3000${NC} da VPS."
echo -e "Para testar localmente na VPS, rode: ${YELLOW}curl http://localhost:3000/health${NC}"
echo -e "\nSe você possuir um subdomínio DNS apontando para o IP desta VPS e quiser"
echo -e "configurar o ${GREEN}Nginx + Certbot (SSL HTTPS grátis Let's Encrypt)${NC},"
echo -e "siga as instruções do README.md do projeto em seu GitHub!"
echo -e "\n${YELLOW}======================================================================${NC}"
