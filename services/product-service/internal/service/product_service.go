package service

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/nasibashop/nasibashop/services/product-service/internal/domain"
	"github.com/nasibashop/nasibashop/services/product-service/internal/events"
	"github.com/nasibashop/nasibashop/services/product-service/internal/repository"
)

type ProductService struct {
	products   *repository.ProductRepository
	categories *repository.CategoryRepository
	events     *events.Publisher
	logger     *slog.Logger
}

func NewProductService(
	products *repository.ProductRepository,
	categories *repository.CategoryRepository,
	publisher *events.Publisher,
	logger *slog.Logger,
) *ProductService {
	return &ProductService{
		products:   products,
		categories: categories,
		events:     publisher,
		logger:     logger,
	}
}

func (s *ProductService) CreateProduct(ctx context.Context, product domain.Product) (domain.Product, error) {
	if product.ID == "" {
		product.ID = uuid.NewString()
	}
	if product.CurrencyCode == "" {
		product.CurrencyCode = "UZS"
	}
	if product.Status == "" {
		product.Status = domain.StatusDraft
	}

	created, err := s.products.Create(ctx, product)
	if err != nil {
		return domain.Product{}, err
	}

	s.events.Publish(ctx, "product.created", created.ID, map[string]any{
		"productId": created.ID,
		"storeId":   created.StoreID,
		"timestamp": time.Now().UTC(),
	})

	return created, nil
}

func (s *ProductService) UpdateProduct(ctx context.Context, id string, product domain.Product) (domain.Product, error) {
	updated, err := s.products.Update(ctx, id, product)
	if err != nil {
		return domain.Product{}, err
	}

	s.events.Publish(ctx, "product.updated", updated.ID, map[string]any{
		"productId": updated.ID,
		"storeId":   updated.StoreID,
		"timestamp": time.Now().UTC(),
	})

	return updated, nil
}

func (s *ProductService) DeleteProduct(ctx context.Context, id string) error {
	if err := s.products.SoftDelete(ctx, id); err != nil {
		return err
	}

	s.events.Publish(ctx, "product.deleted", id, map[string]any{
		"productId": id,
		"timestamp": time.Now().UTC(),
	})

	return nil
}

func (s *ProductService) GetProduct(ctx context.Context, id string) (domain.ProductFull, error) {
	return s.products.GetFull(ctx, id)
}

func (s *ProductService) ListProducts(ctx context.Context, filters domain.ProductFilters) ([]domain.Product, int64, error) {
	return s.products.List(ctx, filters)
}

func (s *ProductService) GetCategories(ctx context.Context) ([]domain.Category, error) {
	return s.categories.ListTree(ctx)
}

func (s *ProductService) CreateCategory(ctx context.Context, category domain.Category) (domain.Category, error) {
	if category.ID == "" {
		category.ID = uuid.NewString()
	}
	return s.categories.Create(ctx, category)
}

func (s *ProductService) UpdateStock(ctx context.Context, productID string, variantID string, storeID string, quantity int) (domain.Stock, error) {
	stock, err := s.products.UpdateStock(ctx, productID, variantID, storeID, quantity)
	if err != nil {
		return domain.Stock{}, err
	}

	s.events.Publish(ctx, "product.stock.changed", stock.ProductID, map[string]any{
		"productId": stock.ProductID,
		"variantId": stock.VariantID,
		"storeId":   stock.StoreID,
		"quantity":  stock.Quantity,
		"reserved":  stock.ReservedQuantity,
		"timestamp": time.Now().UTC(),
	})

	return stock, nil
}

func (s *ProductService) ExportProductsCSV(ctx context.Context, storeID string, writer io.Writer) error {
	filters := domain.ProductFilters{StoreID: storeID, Limit: 10000, Offset: 0}
	products, _, err := s.products.List(ctx, filters)
	if err != nil {
		return err
	}

	csvWriter := csv.NewWriter(writer)
	defer csvWriter.Flush()

	header := []string{"id", "storeId", "categoryId", "titleUz", "descriptionUz", "brand", "priceUnits", "currencyCode", "discountPercent", "status"}
	if err := csvWriter.Write(header); err != nil {
		return err
	}

	for _, product := range products {
		row := []string{
			product.ID,
			product.StoreID,
			product.CategoryID,
			product.TitleUz,
			product.DescriptionUz,
			product.Brand,
			strconv.FormatInt(product.PriceUnits, 10),
			product.CurrencyCode,
			strconv.Itoa(product.DiscountPercent),
			string(product.Status),
		}
		if err := csvWriter.Write(row); err != nil {
			return err
		}
	}

	return csvWriter.Error()
}

func (s *ProductService) ImportProductsCSV(ctx context.Context, reader io.Reader) (int, error) {
	csvReader := csv.NewReader(reader)
	records, err := csvReader.ReadAll()
	if err != nil {
		return 0, err
	}
	if len(records) == 0 {
		return 0, errors.New("empty csv")
	}

	header := records[0]
	index := map[string]int{}
	for i, column := range header {
		index[strings.TrimSpace(column)] = i
	}

	required := []string{"storeId", "categoryId", "titleUz", "descriptionUz", "priceUnits", "status"}
	for _, field := range required {
		if _, ok := index[field]; !ok {
			return 0, errors.New("missing required column: " + field)
		}
	}

	created := 0
	for _, row := range records[1:] {
		priceUnits, err := strconv.ParseInt(strings.TrimSpace(row[index["priceUnits"]]), 10, 64)
		if err != nil {
			return created, err
		}

		discount := 0
		if idx, ok := index["discountPercent"]; ok && idx < len(row) {
			if strings.TrimSpace(row[idx]) != "" {
				discount, err = strconv.Atoi(strings.TrimSpace(row[idx]))
				if err != nil {
					return created, err
				}
			}
		}

		brand := ""
		if idx, ok := index["brand"]; ok && idx < len(row) {
			brand = strings.TrimSpace(row[idx])
		}

		currency := "UZS"
		if idx, ok := index["currencyCode"]; ok && idx < len(row) && strings.TrimSpace(row[idx]) != "" {
			currency = strings.TrimSpace(row[idx])
		}

		product := domain.Product{
			StoreID:         strings.TrimSpace(row[index["storeId"]]),
			CategoryID:      strings.TrimSpace(row[index["categoryId"]]),
			TitleUz:         strings.TrimSpace(row[index["titleUz"]]),
			DescriptionUz:   strings.TrimSpace(row[index["descriptionUz"]]),
			Brand:           brand,
			PriceUnits:      priceUnits,
			CurrencyCode:    currency,
			DiscountPercent: discount,
			Status:          domain.ProductStatus(strings.TrimSpace(row[index["status"]])),
		}

		if idx, ok := index["id"]; ok && idx < len(row) && strings.TrimSpace(row[idx]) != "" {
			product.ID = strings.TrimSpace(row[idx])
		}

		if _, err := s.CreateProduct(ctx, product); err != nil {
			return created, err
		}
		created++
	}

	return created, nil
}

func (s *ProductService) PublishStockEvent(ctx context.Context, stock domain.Stock) {
	s.events.Publish(ctx, "product.stock.changed", stock.ProductID, map[string]any{
		"productId": stock.ProductID,
		"variantId": stock.VariantID,
		"storeId":   stock.StoreID,
		"quantity":  stock.Quantity,
		"reserved":  stock.ReservedQuantity,
		"timestamp": time.Now().UTC(),
	})
}

func (s *ProductService) HandleOrderCreated(ctx context.Context, payload []byte) error {
	var message struct {
		OrderID string `json:"orderId"`
		StoreID string `json:"storeId"`
		Items   []struct {
			ProductID string `json:"productId"`
			VariantID string `json:"variantId"`
			Quantity  int    `json:"quantity"`
		} `json:"items"`
	}

	if err := json.Unmarshal(payload, &message); err != nil {
		return err
	}

	for _, item := range message.Items {
		stock, err := s.products.ReserveStock(ctx, message.StoreID, item.VariantID, item.Quantity)
		if err != nil {
			return err
		}

		s.events.Publish(ctx, "stock.reserved", stock.ProductID, map[string]any{
			"orderId":   message.OrderID,
			"productId": stock.ProductID,
			"variantId": stock.VariantID,
			"storeId":   stock.StoreID,
			"quantity":  item.Quantity,
			"timestamp": time.Now().UTC(),
		})
		s.PublishStockEvent(ctx, stock)
	}

	return nil
}

func (s *ProductService) HandleOrderCancelled(ctx context.Context, payload []byte) error {
	var message struct {
		OrderID string `json:"orderId"`
		StoreID string `json:"storeId"`
		Items   []struct {
			VariantID string `json:"variantId"`
			Quantity  int    `json:"quantity"`
		} `json:"items"`
	}

	if err := json.Unmarshal(payload, &message); err != nil {
		return err
	}

	for _, item := range message.Items {
		stock, err := s.products.ReleaseStock(ctx, message.StoreID, item.VariantID, item.Quantity)
		if err != nil {
			return err
		}

		s.events.Publish(ctx, "stock.released", stock.ProductID, map[string]any{
			"orderId":   message.OrderID,
			"productId": stock.ProductID,
			"variantId": stock.VariantID,
			"storeId":   stock.StoreID,
			"quantity":  item.Quantity,
			"timestamp": time.Now().UTC(),
		})
		s.PublishStockEvent(ctx, stock)
	}

	return nil
}
