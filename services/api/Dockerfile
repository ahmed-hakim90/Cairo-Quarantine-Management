FROM node:22-alpine AS deps
WORKDIR /app
COPY services/shared/package.json services/shared/package-lock.json* ./services/shared/
COPY services/api/package.json services/api/package-lock.json* ./services/api/
WORKDIR /app/services/shared
RUN npm install --omit=dev 2>/dev/null || npm install
WORKDIR /app/services/api
RUN npm install --omit=dev 2>/dev/null || npm install

FROM node:22-alpine AS build
WORKDIR /app
COPY services/shared ./services/shared
COPY services/api ./services/api
WORKDIR /app/services/shared
RUN npm install && npm run build
WORKDIR /app/services/api
RUN npm install && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/shared/package.json /app/services/shared/dist ./services/shared/
COPY --from=build /app/services/shared/node_modules ./services/shared/node_modules
COPY --from=build /app/services/api/package.json /app/services/api/dist ./services/api/
COPY --from=build /app/services/api/node_modules ./services/api/node_modules
WORKDIR /app/services/api
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/health || exit 1
CMD ["node", "dist/index.js"]
