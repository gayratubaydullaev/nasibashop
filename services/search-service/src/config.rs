use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub http_port: u16,
    pub meili_url: String,
    pub meili_key: String,
    pub meili_index: String,
    pub product_service_url: String,
    pub kafka_brokers: String,
    pub reindex_api_key: Option<String>,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            http_port: env::var("HTTP_PORT")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(8086),
            meili_url: env::var("MEILI_URL").unwrap_or_else(|_| "http://localhost:7700".into()),
            meili_key: env::var("MEILI_MASTER_KEY")
                .unwrap_or_else(|_| "nasibashop_meili_dev_master_key".into()),
            meili_index: env::var("MEILI_INDEX").unwrap_or_else(|_| "products".into()),
            product_service_url: env::var("PRODUCT_SERVICE_URL")
                .unwrap_or_else(|_| "http://127.0.0.1:8083".into()),
            kafka_brokers: env::var("KAFKA_BROKERS").unwrap_or_else(|_| "127.0.0.1:9094".into()),
            reindex_api_key: env::var("REINDEX_API_KEY").ok().filter(|s| !s.trim().is_empty()),
        }
    }
}
