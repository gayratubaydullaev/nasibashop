//! JSON shapes from product-service HTTP API.

use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct GetProductResponse {
    pub product: ProductFullDto,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductFullDto {
    pub product: ProductDto,
    pub category: CategoryDto,
    pub stocks: Vec<StockDto>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProductDto {
    pub id: String,
    pub store_id: String,
    pub category_id: String,
    pub title_uz: String,
    pub description_uz: String,
    pub brand: String,
    pub price_units: i64,
    pub currency_code: String,
    pub discount_percent: i32,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CategoryDto {
    pub id: String,
    pub slug: String,
    pub name_uz: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StockDto {
    pub quantity: i32,
    pub reserved_quantity: i32,
}

#[derive(Debug, Deserialize)]
pub struct ListProductsResponse {
    pub products: Vec<ProductIdRow>,
    pub pagination: PaginationDto,
}

#[derive(Debug, Deserialize)]
pub struct ProductIdRow {
    pub id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PaginationDto {
    pub total_count: i64,
}
