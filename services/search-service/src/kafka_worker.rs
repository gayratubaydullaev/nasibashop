use std::sync::Arc;

use anyhow::{Context, Result};
use futures_util::StreamExt;
use rdkafka::config::ClientConfig;
use rdkafka::consumer::{CommitMode, Consumer, StreamConsumer};
use rdkafka::Message;
use serde_json::{json, Value};

use crate::config::Config;
use crate::indexer::Indexer;

pub async fn run(cfg: Config, indexer: Arc<Indexer>) -> Result<()> {
    let consumer: StreamConsumer = ClientConfig::new()
        .set("group.id", "search-service")
        .set("bootstrap.servers", &cfg.kafka_brokers)
        .set("enable.auto.commit", "false")
        .set("auto.offset.reset", "earliest")
        .set("enable.partition.eof", "false")
        .create()
        .context("kafka consumer create")?;

    consumer
        .subscribe(&["product.created", "product.updated", "product.deleted"])
        .context("kafka subscribe")?;

    let mut stream = consumer.stream();
    log::info!("Kafka consumer listening (product.*)");

    while let Some(result) = stream.next().await {
        let msg = match result {
            Ok(m) => m,
            Err(e) => {
                log::error!("kafka recv: {}", e);
                continue;
            }
        };
        let topic = msg.topic();
        let payload = msg.payload().unwrap_or(b"{}");
        let body: Value = serde_json::from_slice(payload).unwrap_or_else(|_| json!({}));
        let product_id = body
            .get("productId")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .or_else(|| {
                msg.key()
                    .map(|k| String::from_utf8_lossy(k).trim_matches('"').to_string())
            })
            .filter(|s| !s.is_empty());

        let Some(pid) = product_id else {
            log::warn!("skip kafka msg: no productId (topic={})", topic);
            let _ = consumer.commit_message(&msg, CommitMode::Async);
            continue;
        };

        let res = match topic {
            "product.deleted" => indexer.delete_product(&pid).await,
            _ => indexer.upsert_product(&pid).await,
        };
        if let Err(e) = res {
            log::error!("index {} topic={}: {}", pid, topic, e);
            continue;
        }
        if let Err(e) = consumer.commit_message(&msg, CommitMode::Async) {
            log::warn!("kafka commit: {}", e);
        }
    }
    Ok(())
}
