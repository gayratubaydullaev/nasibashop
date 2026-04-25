use std::sync::Arc;

use actix_web::http::header::HeaderName;
use actix_web::{web, HttpRequest, HttpResponse, Responder};
use serde::Deserialize;

use crate::config::Config;
use crate::indexer::Indexer;

#[derive(Clone)]
pub struct AppState {
    pub indexer: Arc<Indexer>,
    pub config: Config,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchQuery {
    pub q: Option<String>,
    pub category: Option<String>,
    pub category_id: Option<String>,
    pub min_price: Option<i64>,
    pub max_price: Option<i64>,
    pub store_id: Option<String>,
    pub brand: Option<String>,
    #[serde(default)]
    pub in_stock_only: bool,
    pub sort: Option<String>,
    #[serde(default = "default_limit")]
    pub limit: usize,
    #[serde(default)]
    pub offset: usize,
}

fn default_limit() -> usize {
    20
}

#[derive(Debug, Deserialize)]
pub struct SuggestQuery {
    pub q: Option<String>,
    #[serde(default = "suggest_default_limit")]
    pub limit: usize,
}

fn suggest_default_limit() -> usize {
    8
}

pub async fn health() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({ "status": "ok" }))
}

pub async fn search(state: web::Data<AppState>, q: web::Query<SearchQuery>) -> actix_web::Result<HttpResponse> {
    let s = q.into_inner();
    let out = state
        .indexer
        .search(
            s.q,
            s.category,
            s.category_id,
            s.min_price,
            s.max_price,
            s.store_id,
            s.brand,
            s.in_stock_only,
            s.sort,
            s.limit.max(1).min(100),
            s.offset,
        )
        .await
        .map_err(actix_web::error::ErrorInternalServerError)?;
    Ok(HttpResponse::Ok().json(out))
}

pub async fn suggest(state: web::Data<AppState>, q: web::Query<SuggestQuery>) -> actix_web::Result<HttpResponse> {
    let s = q.into_inner();
    let Some(qs) = s.q.filter(|t| !t.trim().is_empty()) else {
        return Ok(HttpResponse::BadRequest().json(serde_json::json!({"error": "q required"})));
    };
    let out = state
        .indexer
        .suggest(&qs, s.limit.max(1).min(20))
        .await
        .map_err(actix_web::error::ErrorInternalServerError)?;
    Ok(HttpResponse::Ok().json(out))
}

pub async fn reindex(state: web::Data<AppState>, req: HttpRequest) -> actix_web::Result<HttpResponse> {
    if let Some(expected) = &state.config.reindex_api_key {
        let ok = req
            .headers()
            .get(HeaderName::from_static("x-admin-key"))
            .and_then(|v| v.to_str().ok())
            == Some(expected.as_str());
        if !ok {
            return Ok(
                HttpResponse::Unauthorized().json(serde_json::json!({ "error": "missing or invalid X-Admin-Key" })),
            );
        }
    }
    let n = state
        .indexer
        .full_reindex()
        .await
        .map_err(actix_web::error::ErrorInternalServerError)?;
    Ok(HttpResponse::Ok().json(serde_json::json!({ "indexed": n })))
}
