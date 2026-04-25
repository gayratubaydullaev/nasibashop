mod config;
mod handlers;
mod indexer;
mod kafka_worker;
mod models;

use std::sync::Arc;

use actix_web::{web, App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init_from_env(env_logger::Env::default().default_filter_or("info"));

    let cfg = config::Config::from_env();
    let indexer = Arc::new(
        indexer::Indexer::new(&cfg)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?,
    );
    indexer
        .init_index()
        .await
        .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e.to_string()))?;

    if !cfg.kafka_brokers.trim().is_empty() {
        let kcfg = cfg.clone();
        let kix = indexer.clone();
        tokio::spawn(async move {
            if let Err(e) = kafka_worker::run(kcfg, kix).await {
                log::error!("kafka worker exited: {}", e);
            }
        });
    } else {
        log::warn!("KAFKA_BROKERS empty — Kafka consumer disabled");
    }

    let state = web::Data::new(handlers::AppState {
        indexer: indexer.clone(),
        config: cfg.clone(),
    });

    log::info!("search-service listening on 0.0.0.0:{}", cfg.http_port);

    HttpServer::new(move || {
        App::new()
            .app_data(state.clone())
            .route("/health/live", web::get().to(handlers::health))
            .route("/health/ready", web::get().to(handlers::health))
            .route("/api/search", web::get().to(handlers::search))
            .route("/api/search/suggest", web::get().to(handlers::suggest))
            .route("/api/search/reindex", web::post().to(handlers::reindex))
    })
    .bind(("0.0.0.0", cfg.http_port))?
    .run()
    .await
}
