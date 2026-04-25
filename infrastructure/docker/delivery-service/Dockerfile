FROM golang:1.22-alpine AS build
WORKDIR /src/services/delivery-service

COPY services/delivery-service/go.mod ./
COPY services/delivery-service/ ./
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o /out/delivery-service ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/delivery-service /app/delivery-service
USER nonroot:nonroot
EXPOSE 8085
ENTRYPOINT ["/app/delivery-service"]
