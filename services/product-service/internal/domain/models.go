package domain

import "time"

type ProductStatus string

const (
	StatusDraft    ProductStatus = "DRAFT"
	StatusActive   ProductStatus = "ACTIVE"
	StatusArchived ProductStatus = "ARCHIVED"
)

type ProductVariant struct {
	ID                 string `json:"id"`
	ProductID          string `json:"productId"`
	SKU                string `json:"sku"`
	Color              string `json:"color"`
	Size               string `json:"size"`
	PriceOverrideUnits *int64 `json:"priceOverrideUnits,omitempty"`
	Active             bool   `json:"active"`
}

type ProductImage struct {
	ID        string `json:"id"`
	ProductID string `json:"productId"`
	MediaID   string `json:"mediaId,omitempty"`
	URL       string `json:"url"`
	AltText   string `json:"altText"`
	SortOrder int    `json:"sortOrder"`
}

type Stock struct {
	ID               string    `json:"id"`
	ProductID        string    `json:"productId"`
	VariantID        string    `json:"variantId"`
	StoreID          string    `json:"storeId"`
	Quantity         int       `json:"quantity"`
	ReservedQuantity int       `json:"reservedQuantity"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type Product struct {
	ID              string           `json:"id"`
	StoreID         string           `json:"storeId"`
	CategoryID      string           `json:"categoryId"`
	TitleUz         string           `json:"titleUz"`
	DescriptionUz   string           `json:"descriptionUz"`
	Brand           string           `json:"brand"`
	PriceUnits      int64            `json:"priceUnits"`
	CurrencyCode    string           `json:"currencyCode"`
	DiscountPercent int              `json:"discountPercent"`
	Status          ProductStatus    `json:"status"`
	Variants        []ProductVariant `json:"variants,omitempty"`
	Images          []ProductImage   `json:"images,omitempty"`
	CreatedAt       time.Time        `json:"createdAt"`
	UpdatedAt       time.Time        `json:"updatedAt"`
}

type ProductFull struct {
	Product  Product   `json:"product"`
	Category Category  `json:"category"`
	Stocks   []Stock   `json:"stocks"`
}

type Category struct {
	ID            string     `json:"id"`
	ParentID      string     `json:"parentId,omitempty"`
	Slug          string     `json:"slug"`
	NameUz        string     `json:"nameUz"`
	DescriptionUz string     `json:"descriptionUz,omitempty"`
	SortOrder     int        `json:"sortOrder"`
	Children      []Category `json:"children,omitempty"`
}

type ProductFilters struct {
	Query         string
	CategoryID    string
	StoreID       string
	Brand         string
	MinPriceUnits *int64
	MaxPriceUnits *int64
	InStockOnly   bool
	Status        ProductStatus
	Limit         int
	Offset        int
}
