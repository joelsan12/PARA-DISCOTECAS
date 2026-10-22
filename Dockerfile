FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Copiar manifiestos de paquetes
COPY package.json package-lock.json ./
COPY functions/package.json functions/package-lock.json ./functions/
COPY services/door-service/package.json services/door-service/package-lock.json ./services/door-service/

# Instalar dependencias completas para build
RUN npm ci --ignore-scripts
RUN cd functions && npm ci --ignore-scripts
RUN cd services/door-service && npm ci --ignore-scripts

# Copiar código fuente
COPY tsconfig*.json ./
COPY scripts ./scripts
COPY functions ./functions
COPY services/door-service ./services/door-service

# Compilar door-service y functions/server
RUN npm run build:backend

# Etapa final de producción (ligera)
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package.json ./
COPY functions/package.json ./functions/
COPY services/door-service/package.json ./services/door-service/

# Copiar dependencias de producción ya resueltas
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/functions/node_modules ./functions/node_modules
COPY --from=builder /app/services/door-service/node_modules ./services/door-service/node_modules

# Copiar artefactos compilados
COPY --from=builder /app/functions/lib ./functions/lib
COPY --from=builder /app/services/door-service/dist ./services/door-service/dist

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "functions/lib/server.js"]
