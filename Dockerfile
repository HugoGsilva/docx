# ==========================================
# Stage 1: Build do Frontend
# ==========================================
FROM node:18-slim AS frontend-builder

WORKDIR /app/client

# Copiar arquivos de dependências do frontend
COPY client/package*.json ./

# Instalar dependências
RUN npm ci

# Copiar código fonte do frontend
COPY client/ ./

# Build do frontend
RUN npm run build

# ==========================================
# Stage 2: Build e Runtime do Backend
# ==========================================
FROM node:18-slim AS production

# Instalar LibreOffice e dependências para conversão PDF
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-liberation \
    fonts-dejavu \
    fontconfig \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Aceitar EULA das fontes Microsoft e instalar (opcional, mas recomendado)
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    software-properties-common \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
    ttf-mscorefonts-installer \
    || echo "Microsoft fonts not available, using alternatives" \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Atualizar cache de fontes
RUN fc-cache -fv

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências do backend
COPY server/package*.json ./server/

# Instalar dependências do backend
WORKDIR /app/server
RUN npm ci --only=production

# Voltar para diretório raiz
WORKDIR /app

# Copiar código fonte do backend
COPY server/ ./server/

# Copiar templates
COPY templates/ ./templates/

# Copiar frontend buildado do stage anterior
COPY --from=frontend-builder /app/client/dist ./client/dist

# Definir variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3001

# Expor porta
EXPOSE 3001

# Comando para iniciar a aplicação
WORKDIR /app/server
CMD ["node", "src/index.js"]
