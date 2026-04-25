# Build from monorepo root:
#   docker build -f infrastructure/docker/payment-service/Dockerfile .
FROM node:20-alpine AS build
WORKDIR /app
COPY services/payment-service/package.json services/payment-service/package-lock.json ./
RUN npm ci
COPY services/payment-service/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY services/payment-service/package.json services/payment-service/package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 8082
CMD ["node", "dist/main.js"]
