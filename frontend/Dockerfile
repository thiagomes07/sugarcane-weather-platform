# ============================================
# ESTÁGIO BASE
# ============================================
FROM node:20-alpine AS base
WORKDIR /app

# Instalar dependências necessárias
RUN apk add --no-cache libc6-compat

# ============================================
# ESTÁGIO DE DEPENDÊNCIAS
# ============================================
FROM base AS deps

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./

# Instalar dependências
RUN npm ci

# ============================================
# ESTÁGIO DE BUILD (para produção)
# ============================================
FROM base AS builder
WORKDIR /app

# Copiar dependências do estágio anterior
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fonte
COPY . .

# Variáveis de ambiente para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build da aplicação (SSG)
RUN npm run build

# ============================================
# ESTÁGIO DE DESENVOLVIMENTO
# ============================================
FROM base AS development
WORKDIR /app

# Copiar dependências
COPY --from=deps /app/node_modules ./node_modules

# Copiar arquivos de configuração
COPY package.json package-lock.json* next.config.ts tsconfig.json ./
COPY components.json postcss.config.mjs ./

# Copiar código fonte (volumes sobrescrevem em runtime)
COPY . .

# Expor porta
EXPOSE 3000

# Comando de desenvolvimento com hot reload
CMD ["npm", "run", "dev"]

# ============================================
# ESTÁGIO DE PRODUÇÃO (para deploy futuro)
# ============================================
FROM nginx:1.25-alpine AS production

# Copiar build estático para Nginx
COPY --from=builder /app/out /usr/share/nginx/html

# Configuração básica do Nginx
RUN echo 'server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]