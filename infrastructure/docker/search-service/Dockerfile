# actix/reqwest va boshqa yangi relizlar Rust 1.88+ (va ba’zi kratlar edition 2024) talab qiladi;
# 1.83 da `cargo build` yiqiladi (masalan crypto-common 0.2.1).
FROM rust:1.88-bookworm AS build
RUN apt-get update && apt-get install -y cmake g++ pkg-config libssl-dev libsasl2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
# Butun loyiha: src + Cargo.toml (+ kelgusida Cargo.lock) — alohida `Cargo.lock*` kabi glob kerak emas
COPY services/search-service/ ./
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/release/search-service /app/search-service
EXPOSE 8086
ENTRYPOINT ["/app/search-service"]
