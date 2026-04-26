FROM golang:1.22-alpine AS build
WORKDIR /src

COPY packages/go-health ./packages/go-health/

WORKDIR /src/services/user-service
COPY services/user-service/go.mod ./
COPY services/user-service/ ./
RUN go mod tidy && CGO_ENABLED=0 GOOS=linux go build -o /out/user-service ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/user-service /app/user-service
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/user-service"]
