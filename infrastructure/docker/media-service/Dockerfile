FROM golang:1.22-alpine AS build
WORKDIR /src/services/media-service

COPY services/media-service/go.mod ./
COPY services/media-service/ ./
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o /out/media-service ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/media-service /app/media-service
USER nonroot:nonroot
EXPOSE 8088
ENTRYPOINT ["/app/media-service"]
