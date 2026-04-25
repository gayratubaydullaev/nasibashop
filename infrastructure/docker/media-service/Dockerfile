# WebP encode: github.com/chai2010/webp — CGO + libwebp
FROM golang:1.22-alpine AS build
RUN apk add --no-cache build-base libwebp-dev
WORKDIR /src/services/media-service

COPY services/media-service/go.mod ./
COPY services/media-service/ ./
ENV CGO_ENABLED=1
RUN go mod tidy && go build -o /out/media-service ./cmd/server

FROM alpine:3.20
RUN apk add --no-cache ca-certificates libwebp
WORKDIR /app
COPY --from=build /out/media-service /app/media-service
USER nobody
EXPOSE 8088
ENTRYPOINT ["/app/media-service"]
