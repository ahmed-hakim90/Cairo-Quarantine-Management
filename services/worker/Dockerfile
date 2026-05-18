FROM node:22-alpine AS build
WORKDIR /app
COPY services/shared ./services/shared
COPY services/worker ./services/worker
WORKDIR /app/services/shared
RUN npm install && npm run build
WORKDIR /app/services/worker
RUN npm install && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/services/shared/package.json /app/services/shared/dist ./services/shared/
COPY --from=build /app/services/shared/node_modules ./services/shared/node_modules
COPY --from=build /app/services/worker/package.json /app/services/worker/dist ./services/worker/
COPY --from=build /app/services/worker/node_modules ./services/worker/node_modules
WORKDIR /app/services/worker
HEALTHCHECK --interval=60s --timeout=5s --start-period=15s --retries=3 \
  CMD pgrep -f "node dist/index.js" >/dev/null || exit 1
CMD ["node", "dist/index.js"]
