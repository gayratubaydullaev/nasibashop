FROM golang:1.22-alpine AS build
WORKDIR /src

COPY services/user-service/go.mod ./services/user-service/
WORKDIR /src/services/user-service
RUN go mod download

COPY services/user-service/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/user-service ./cmd/server

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/user-service /app/user-service
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/user-service"]
