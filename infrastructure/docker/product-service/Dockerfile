FROM golang:1.22-alpine AS build
WORKDIR /src

COPY services/product-service/go.mod ./services/product-service/
WORKDIR /src/services/product-service
RUN go mod download

COPY services/product-service/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/product-service ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/product-service /app/product-service
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/product-service"]
