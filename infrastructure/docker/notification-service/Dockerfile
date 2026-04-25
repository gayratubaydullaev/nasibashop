# Build from monorepo root:
#   docker build -f infrastructure/docker/notification-service/Dockerfile .
FROM node:20-alpine AS build
WORKDIR /app
COPY services/notification-service/package.json services/notification-service/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install
COPY services/notification-service/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY services/notification-service/package.json services/notification-service/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 8087
CMD ["node", "dist/main.js"]
