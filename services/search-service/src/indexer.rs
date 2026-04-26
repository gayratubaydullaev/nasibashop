use std::time::Duration;

use anyhow::{Context, Result};
use chrono::DateTime;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use reqwest::{Method, StatusCode};
use serde::Serialize;
use serde_json::{json, Value};

use crate::config::Config;
use crate::models::{GetProductResponse, ListProductsResponse, ProductFullDto};

pub struct Indexer {
    meili_url: String,
    meili_key: String,
    index_uid: String,
    product_base: String,
    http: reqwest::Client,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct SearchDocument {
    id: String,
    title_uz: String,
    description_uz: String,
    brand: String,
    price_units: i64,
    currency_code: String,
    discount_percent: i32,
    status: String,
    store_id: String,
    category_id: String,
    category_slug: String,
    category_name_uz: String,
    in_stock: bool,
    created_at: i64,
    popularity: i32,
}

impl Indexer {
    pub fn new(cfg: &Config) -> Result<Self> {
        let http = reqwest::Client::builder()
            .timeout(Duration::from_secs(60))
            .build()
            .context("reqwest client")?;
        Ok(Self {
            meili_url: cfg.meili_url.trim_end_matches('/').to_string(),
            meili_key: cfg.meili_key.clone(),
            index_uid: cfg.meili_index.clone(),
            product_base: cfg.product_service_url.trim_end_matches('/').to_string(),
            http,
        })
    }

    fn meili_headers(&self) -> HeaderMap {
        let mut h = HeaderMap::new();
        let bearer = format!("Bearer {}", self.meili_key);
        h.insert(
            AUTHORIZATION,
            HeaderValue::from_str(&bearer).expect("header"),
        );
        h
    }

    async fn meili_send(&self, method: Method, path: &str, body: Option<Value>) -> Result<Value> {
        let url = format!("{}{}", self.meili_url, path);
        let mut req = self
            .http
            .request(method, &url)
            .headers(self.meili_headers());
        if let Some(b) = body {
            req = req.json(&b);
        }
        let res = req.send().await.with_context(|| format!("meili {}", url))?;
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        if status == StatusCode::NO_CONTENT {
            return Ok(Value::Null);
        }
        if !status.is_success() {
            anyhow::bail!("meili HTTP {}: {}", status, text);
        }
        if text.trim().is_empty() {
            return Ok(Value::Null);
        }
        serde_json::from_str(&text).context("meili json")
    }

    async fn wait_task(&self, task_uid: u64) -> Result<()> {
        for _ in 0..600 {
            let v: Value = self
                .meili_send(Method::GET, &format!("/tasks/{}", task_uid), None)
                .await?;
            let status = v["status"].as_str().unwrap_or("");
            if status == "succeeded" {
                return Ok(());
            }
            if status == "failed" {
                anyhow::bail!("meili task failed: {}", v);
            }
            tokio::time::sleep(Duration::from_millis(200)).await;
        }
        anyhow::bail!("meili task {} timeout", task_uid)
    }

    async fn enqueue_and_wait(&self, v: Value) -> Result<()> {
        let task_uid = v["taskUid"]
            .as_u64()
            .or_else(|| v["taskUid"].as_i64().map(|n| n as u64))
            .context("missing taskUid")?;
        self.wait_task(task_uid).await
    }

    pub async fn init_index(&self) -> Result<()> {
        let create_body = json!({ "uid": self.index_uid, "primaryKey": "id" });
        let r = self
            .http
            .post(format!("{}/indexes", self.meili_url))
            .headers(self.meili_headers())
            .json(&create_body)
            .send()
            .await?;
        let status = r.status();
        let bytes = r.bytes().await.unwrap_or_default();
        if status.is_success() {
            if !bytes.is_empty() {
                let v: Value = serde_json::from_slice(&bytes).context("create index response")?;
                if v.get("taskUid").is_some() {
                    self.enqueue_and_wait(v).await?;
                }
            }
        } else if status == StatusCode::CONFLICT {
            // index already exists
        } else if status == StatusCode::BAD_REQUEST {
            let t = String::from_utf8_lossy(&bytes);
            if !t.contains("already exists") && !t.contains("index_already_exists") {
                anyhow::bail!("create index: {}", t);
            }
        } else {
            anyhow::bail!(
                "create index HTTP {}: {}",
                status,
                String::from_utf8_lossy(&bytes)
            );
        }

        let settings = json!({
            "searchableAttributes": ["titleUz", "descriptionUz", "brand", "categoryNameUz"],
            "filterableAttributes": ["storeId", "categoryId", "categorySlug", "brand", "status", "inStock", "priceUnits"],
            "sortableAttributes": ["priceUnits", "createdAt", "popularity"],
            "synonyms": {
                "telefon": ["smartfon", "mobil", "мобильный", "mobile"]
            }
        });
        let path = format!("/indexes/{}/settings", self.index_uid);
        let task = self
            .meili_send(Method::PATCH, &path, Some(settings))
            .await?;
        self.enqueue_and_wait(task).await?;
        Ok(())
    }

    async fn fetch_product_full(&self, product_id: &str) -> Result<ProductFullDto> {
        let url = format!("{}/products/{}", self.product_base, product_id);
        let res = self
            .http
            .get(&url)
            .send()
            .await
            .with_context(|| format!("GET {}", url))?
            .error_for_status()
            .with_context(|| format!("status GET {}", url))?;
        let body: GetProductResponse = res.json().await.context("decode product json")?;
        Ok(body.product)
    }

    fn to_doc(full: ProductFullDto) -> SearchDocument {
        let in_stock = full.stocks.iter().any(|s| s.quantity > s.reserved_quantity);
        let created_at = DateTime::parse_from_rfc3339(&full.product.created_at)
            .map(|d| d.timestamp())
            .unwrap_or(0);
        SearchDocument {
            id: full.product.id.clone(),
            title_uz: full.product.title_uz,
            description_uz: full.product.description_uz,
            brand: full.product.brand,
            price_units: full.product.price_units,
            currency_code: full.product.currency_code,
            discount_percent: full.product.discount_percent,
            status: full.product.status,
            store_id: full.product.store_id,
            category_id: full.product.category_id,
            category_slug: full.category.slug,
            category_name_uz: full.category.name_uz,
            in_stock,
            created_at,
            popularity: 0,
        }
    }

    pub async fn upsert_product(&self, product_id: &str) -> Result<()> {
        let full = self.fetch_product_full(product_id).await?;
        let doc = Self::to_doc(full);
        let path = format!("/indexes/{}/documents?primaryKey=id", self.index_uid);
        let task = self
            .meili_send(Method::POST, &path, Some(json!([doc])))
            .await?;
        self.enqueue_and_wait(task).await
    }

    pub async fn delete_product(&self, product_id: &str) -> Result<()> {
        let path = format!("/indexes/{}/documents/{}", self.index_uid, product_id);
        let task = self.meili_send(Method::DELETE, &path, None).await?;
        if task.is_null() {
            return Ok(());
        }
        self.enqueue_and_wait(task).await
    }

    pub async fn full_reindex(&self) -> Result<usize> {
        let url = format!("{}/indexes/{}", self.meili_url, self.index_uid);
        let del = self
            .http
            .delete(&url)
            .headers(self.meili_headers())
            .send()
            .await?;
        if del.status().is_success() {
            let bytes = del.bytes().await?;
            if !bytes.is_empty() {
                let v: Value = serde_json::from_slice(&bytes).context("delete index task json")?;
                self.enqueue_and_wait(v).await?;
            }
        } else if del.status() != StatusCode::NOT_FOUND {
            del.error_for_status().context("delete index")?;
        }

        self.init_index().await?;

        let mut indexed = 0usize;
        let limit = 100i32;
        let mut offset = 0i32;
        loop {
            let url = format!(
                "{}/products?limit={}&offset={}",
                self.product_base, limit, offset
            );
            let res = self.http.get(&url).send().await?.error_for_status()?;
            let page: ListProductsResponse = res.json().await?;
            if page.products.is_empty() {
                break;
            }
            for row in &page.products {
                if self.upsert_product(&row.id).await.is_ok() {
                    indexed += 1;
                }
            }
            offset += limit;
            if (offset as i64) >= page.pagination.total_count {
                break;
            }
        }
        Ok(indexed)
    }

    pub async fn search(
        &self,
        q: Option<String>,
        category: Option<String>,
        category_id: Option<String>,
        min_price: Option<i64>,
        max_price: Option<i64>,
        store_id: Option<String>,
        brand: Option<String>,
        in_stock_only: bool,
        sort: Option<String>,
        limit: usize,
        offset: usize,
    ) -> Result<Value> {
        let mut filters: Vec<String> = Vec::new();
        if let Some(cid) = category_id.filter(|s| !s.is_empty()) {
            filters.push(format!("categoryId = \"{}\"", cid.replace('"', "")));
        }
        if let Some(slug) = category.filter(|s| !s.is_empty()) {
            filters.push(format!("categorySlug = \"{}\"", slug.replace('"', "")));
        }
        if let Some(sid) = store_id.filter(|s| !s.is_empty()) {
            filters.push(format!("storeId = \"{}\"", sid.replace('"', "")));
        }
        if let Some(b) = brand.filter(|s| !s.is_empty()) {
            filters.push(format!("brand = \"{}\"", b.replace('"', "")));
        }
        if in_stock_only {
            filters.push("inStock = true".into());
        }
        if let Some(min) = min_price {
            filters.push(format!("priceUnits >= {}", min));
        }
        if let Some(max) = max_price {
            filters.push(format!("priceUnits <= {}", max));
        }

        let mut body = json!({
            "limit": limit,
            "offset": offset,
        });
        if let Some(query) = q.as_ref().filter(|s| !s.is_empty()) {
            body["q"] = json!(query);
        }
        if !filters.is_empty() {
            body["filter"] = json!(filters.join(" AND "));
        }
        let sort_arr: Vec<String> = match sort.as_deref() {
            Some("price_asc") => vec!["priceUnits:asc".into()],
            Some("price_desc") => vec!["priceUnits:desc".into()],
            Some("created_at_desc") => vec!["createdAt:desc".into()],
            Some("popularity_desc") => vec!["popularity:desc".into()],
            _ => vec![],
        };
        if !sort_arr.is_empty() {
            body["sort"] = json!(sort_arr);
        }

        let path = format!("/indexes/{}/search", self.index_uid);
        self.meili_send(Method::POST, &path, Some(body)).await
    }

    pub async fn suggest(&self, q: &str, limit: usize) -> Result<Value> {
        let body = json!({
            "q": q,
            "limit": limit.min(20),
            "attributesToRetrieve": ["id", "titleUz", "brand", "priceUnits", "categorySlug"]
        });
        let path = format!("/indexes/{}/search", self.index_uid);
        self.meili_send(Method::POST, &path, Some(body)).await
    }

    /// Readiness: Meilisearch `GET /health` (без Bearer).
    pub async fn ping_meilisearch(&self) -> Result<()> {
        let url = format!("{}/health", self.meili_url);
        let res = self
            .http
            .get(url)
            .timeout(Duration::from_secs(2))
            .send()
            .await
            .context("meilisearch /health")?;
        if !res.status().is_success() {
            anyhow::bail!("meilisearch status {}", res.status());
        }
        Ok(())
    }

    /// JSON для `GET /health/ready`: `{ status, checks }` или 503 с `component` + `detail`.
    /// Только Meilisearch; Kafka-воркер в фоне и не входит в HTTP readiness.
    pub async fn readiness_response(&self) -> (bool, serde_json::Value) {
        use serde_json::json;

        let mut checks = serde_json::Map::new();
        if let Err(e) = self.ping_meilisearch().await {
            checks.insert("meilisearch".into(), json!("DOWN"));
            return (
                false,
                json!({
                    "status": "unavailable",
                    "component": "meilisearch",
                    "checks": checks,
                    "detail": e.to_string(),
                }),
            );
        }
        checks.insert("meilisearch".into(), json!("UP"));
        (true, json!({ "status": "ok", "checks": checks }))
    }
}
