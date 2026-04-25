FROM rust:1.83-bookworm AS build
RUN apt-get update && apt-get install -y cmake g++ pkg-config libssl-dev libsasl2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY services/search-service/Cargo.toml ./
COPY services/search-service/src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/release/search-service /app/search-service
EXPOSE 8086
ENTRYPOINT ["/app/search-service"]
