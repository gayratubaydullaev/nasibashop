package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/nasibashop/nasibashop/services/product-service/internal/domain"
)

var ErrNotFound = errors.New("not found")

type ProductRepository struct {
	db *pgxpool.Pool
}

func NewProductRepository(db *pgxpool.Pool) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) Create(ctx context.Context, product domain.Product) (domain.Product, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return domain.Product{}, err
	}
	defer tx.Rollback(ctx)

	const insertProduct = `
		INSERT INTO products (id, store_id, category_id, title_uz, description_uz, brand, price_units, currency_code, discount_percent, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, store_id, category_id::text, title_uz, description_uz, brand, price_units, currency_code, discount_percent, status, is_deleted, created_at, updated_at`

	created, err := scanProduct(tx.QueryRow(ctx, insertProduct,
		product.ID,
		product.StoreID,
		product.CategoryID,
		product.TitleUz,
		product.DescriptionUz,
		product.Brand,
		product.PriceUnits,
		product.CurrencyCode,
		product.DiscountPercent,
		product.Status,
	))
	if err != nil {
		return domain.Product{}, err
	}

	for _, variant := range product.Variants {
		if variant.ID == "" {
			variant.ID = uuid.NewString()
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO product_variants (id, product_id, sku, color, size, price_override_units, active)
			VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			variant.ID,
			created.ID,
			variant.SKU,
			variant.Color,
			variant.Size,
			variant.PriceOverrideUnits,
			variant.Active,
		); err != nil {
			return domain.Product{}, err
		}
	}

	for _, image := range product.Images {
		if image.ID == "" {
			image.ID = uuid.NewString()
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO product_images (id, product_id, media_id, url, alt_text, sort_order)
			VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6)`,
			image.ID,
			created.ID,
			image.MediaID,
			image.URL,
			image.AltText,
			image.SortOrder,
		); err != nil {
			return domain.Product{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.Product{}, err
	}

	return r.GetByID(ctx, created.ID)
}

func (r *ProductRepository) Update(ctx context.Context, id string, product domain.Product) (domain.Product, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return domain.Product{}, err
	}
	defer tx.Rollback(ctx)

	const updateProduct = `
		UPDATE products
		SET store_id = $2,
			category_id = $3,
			title_uz = $4,
			description_uz = $5,
			brand = $6,
			price_units = $7,
			currency_code = $8,
			discount_percent = $9,
			status = $10,
			updated_at = now()
		WHERE id = $1 AND is_deleted = false
		RETURNING id, store_id, category_id::text, title_uz, description_uz, brand, price_units, currency_code, discount_percent, status, is_deleted, created_at, updated_at`

	updated, err := scanProduct(tx.QueryRow(ctx, updateProduct,
		id,
		product.StoreID,
		product.CategoryID,
		product.TitleUz,
		product.DescriptionUz,
		product.Brand,
		product.PriceUnits,
		product.CurrencyCode,
		product.DiscountPercent,
		product.Status,
	))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Product{}, ErrNotFound
	}
	if err != nil {
		return domain.Product{}, err
	}

	if _, err := tx.Exec(ctx, `DELETE FROM product_variants WHERE product_id = $1`, id); err != nil {
		return domain.Product{}, err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM product_images WHERE product_id = $1`, id); err != nil {
		return domain.Product{}, err
	}

	for _, variant := range product.Variants {
		if variant.ID == "" {
			variant.ID = uuid.NewString()
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO product_variants (id, product_id, sku, color, size, price_override_units, active)
			VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			variant.ID,
			updated.ID,
			variant.SKU,
			variant.Color,
			variant.Size,
			variant.PriceOverrideUnits,
			variant.Active,
		); err != nil {
			return domain.Product{}, err
		}
	}

	for _, image := range product.Images {
		if image.ID == "" {
			image.ID = uuid.NewString()
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO product_images (id, product_id, media_id, url, alt_text, sort_order)
			VALUES ($1, $2, NULLIF($3, ''), $4, $5, $6)`,
			image.ID,
			updated.ID,
			image.MediaID,
			image.URL,
			image.AltText,
			image.SortOrder,
		); err != nil {
			return domain.Product{}, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.Product{}, err
	}

	return r.GetByID(ctx, updated.ID)
}

func (r *ProductRepository) SoftDelete(ctx context.Context, id string) error {
	cmd, err := r.db.Exec(ctx, `
		UPDATE products
		SET is_deleted = true,
			status = 'ARCHIVED',
			updated_at = now()
		WHERE id = $1 AND is_deleted = false`, id)
	if err != nil {
		return err
	}
	if cmd.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *ProductRepository) GetByID(ctx context.Context, id string) (domain.Product, error) {
	const query = `
		SELECT id, store_id, category_id::text, title_uz, description_uz, brand, price_units, currency_code, discount_percent, status, is_deleted, created_at, updated_at
		FROM products
		WHERE id = $1 AND is_deleted = false`

	product, err := scanProduct(r.db.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Product{}, ErrNotFound
	}
	if err != nil {
		return domain.Product{}, err
	}

	variants, err := r.listVariants(ctx, product.ID)
	if err != nil {
		return domain.Product{}, err
	}
	images, err := r.listImages(ctx, product.ID)
	if err != nil {
		return domain.Product{}, err
	}

	product.Variants = variants
	product.Images = images
	return product, nil
}

func (r *ProductRepository) GetFull(ctx context.Context, id string) (domain.ProductFull, error) {
	product, err := r.GetByID(ctx, id)
	if err != nil {
		return domain.ProductFull{}, err
	}

	const categoryQuery = `
		SELECT id::text, COALESCE(parent_id::text, ''), slug, name_uz, COALESCE(description_uz, ''), sort_order
		FROM categories
		WHERE id = $1::uuid`

	category, err := scanCategory(r.db.QueryRow(ctx, categoryQuery, product.CategoryID))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ProductFull{}, ErrNotFound
	}
	if err != nil {
		return domain.ProductFull{}, err
	}

	stocks, err := r.listStocksForProduct(ctx, product.ID)
	if err != nil {
		return domain.ProductFull{}, err
	}

	return domain.ProductFull{
		Product:  product,
		Category: category,
		Stocks:   stocks,
	}, nil
}

func (r *ProductRepository) List(ctx context.Context, filters domain.ProductFilters) ([]domain.Product, int64, error) {
	where := []string{"p.is_deleted = false"}
	args := []any{}
	argPos := 1

	if filters.StoreID != "" {
		where = append(where, fmt.Sprintf("p.store_id = $%d", argPos))
		args = append(args, filters.StoreID)
		argPos++
	}
	if filters.CategoryID != "" {
		where = append(where, fmt.Sprintf("p.category_id = $%d::uuid", argPos))
		args = append(args, filters.CategoryID)
		argPos++
	}
	if filters.Brand != "" {
		where = append(where, fmt.Sprintf("p.brand ILIKE $%d", argPos))
		args = append(args, "%"+filters.Brand+"%")
		argPos++
	}
	if filters.Status != "" {
		where = append(where, fmt.Sprintf("p.status = $%d", argPos))
		args = append(args, string(filters.Status))
		argPos++
	}
	if filters.Query != "" {
		where = append(where, fmt.Sprintf("(p.title_uz ILIKE $%d OR p.description_uz ILIKE $%d)", argPos, argPos))
		args = append(args, "%"+filters.Query+"%")
		argPos++
	}
	if filters.MinPriceUnits != nil {
		where = append(where, fmt.Sprintf("p.price_units >= $%d", argPos))
		args = append(args, *filters.MinPriceUnits)
		argPos++
	}
	if filters.MaxPriceUnits != nil {
		where = append(where, fmt.Sprintf("p.price_units <= $%d", argPos))
		args = append(args, *filters.MaxPriceUnits)
		argPos++
	}
	if filters.InStockOnly {
		where = append(where, `EXISTS (
			SELECT 1 FROM stocks s
			JOIN product_variants v ON v.id = s.variant_id
			WHERE v.product_id = p.id AND (s.quantity - s.reserved_quantity) > 0
		)`)
	}

	whereSQL := strings.Join(where, " AND ")

	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM products p WHERE %s`, whereSQL)
	var total int64
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := filters.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	offset := filters.Offset
	if offset < 0 {
		offset = 0
	}

	listQuery := fmt.Sprintf(`
		SELECT p.id, p.store_id, p.category_id::text, p.title_uz, p.description_uz, p.brand, p.price_units, p.currency_code, p.discount_percent, p.status, p.is_deleted, p.created_at, p.updated_at
		FROM products p
		WHERE %s
		ORDER BY p.created_at DESC
		LIMIT %d OFFSET %d`, whereSQL, limit, offset)

	rows, err := r.db.Query(ctx, listQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	products := make([]domain.Product, 0)
	for rows.Next() {
		product, err := scanProduct(rows)
		if err != nil {
			return nil, 0, err
		}
		products = append(products, product)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	for i := range products {
		variants, err := r.listVariants(ctx, products[i].ID)
		if err != nil {
			return nil, 0, err
		}
		images, err := r.listImages(ctx, products[i].ID)
		if err != nil {
			return nil, 0, err
		}
		products[i].Variants = variants
		products[i].Images = images
	}

	return products, total, nil
}

func (r *ProductRepository) UpdateStock(ctx context.Context, productID string, variantID string, storeID string, quantity int) (domain.Stock, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return domain.Stock{}, err
	}
	defer tx.Rollback(ctx)

	const ensureVariant = `
		SELECT 1 FROM product_variants v
		JOIN products p ON p.id = v.product_id
		WHERE v.id = $1::uuid AND v.product_id = $2::uuid AND p.store_id = $3 AND p.is_deleted = false`

	var exists int
	if err := tx.QueryRow(ctx, ensureVariant, variantID, productID, storeID).Scan(&exists); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Stock{}, ErrNotFound
		}
		return domain.Stock{}, err
	}

	const upsert = `
		INSERT INTO stocks (id, product_id, variant_id, store_id, quantity, reserved_quantity, updated_at)
		VALUES ($1, $2, $3, $4, $5, 0, now())
		ON CONFLICT (variant_id, store_id)
		DO UPDATE SET quantity = EXCLUDED.quantity, updated_at = now()
		RETURNING id::text, product_id::text, variant_id::text, store_id, quantity, reserved_quantity, updated_at`

	stockID := uuid.NewString()
	stock, err := scanStock(tx.QueryRow(ctx, upsert, stockID, productID, variantID, storeID, quantity))
	if err != nil {
		return domain.Stock{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.Stock{}, err
	}

	return stock, nil
}

func (r *ProductRepository) ReserveStock(ctx context.Context, storeID string, variantID string, qty int) (domain.Stock, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return domain.Stock{}, err
	}
	defer tx.Rollback(ctx)

	const query = `
		UPDATE stocks
		SET reserved_quantity = reserved_quantity + $3,
			updated_at = now()
		WHERE variant_id = $1::uuid
			AND store_id = $2
			AND (quantity - reserved_quantity) >= $3
		RETURNING id::text, product_id::text, variant_id::text, store_id, quantity, reserved_quantity, updated_at`

	stock, err := scanStock(tx.QueryRow(ctx, query, variantID, storeID, qty))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Stock{}, fmt.Errorf("insufficient stock for variant %s", variantID)
	}
	if err != nil {
		return domain.Stock{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.Stock{}, err
	}
	return stock, nil
}

func (r *ProductRepository) ReleaseStock(ctx context.Context, storeID string, variantID string, qty int) (domain.Stock, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return domain.Stock{}, err
	}
	defer tx.Rollback(ctx)

	const query = `
		UPDATE stocks
		SET reserved_quantity = GREATEST(reserved_quantity - $3, 0),
			updated_at = now()
		WHERE variant_id = $1::uuid
			AND store_id = $2
			AND reserved_quantity >= $3
		RETURNING id::text, product_id::text, variant_id::text, store_id, quantity, reserved_quantity, updated_at`

	stock, err := scanStock(tx.QueryRow(ctx, query, variantID, storeID, qty))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.Stock{}, fmt.Errorf("cannot release reservation for variant %s", variantID)
	}
	if err != nil {
		return domain.Stock{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.Stock{}, err
	}
	return stock, nil
}

func (r *ProductRepository) listVariants(ctx context.Context, productID string) ([]domain.ProductVariant, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id::text, product_id::text, sku, color, size, price_override_units, active
		FROM product_variants
		WHERE product_id = $1::uuid
		ORDER BY created_at ASC`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	variants := make([]domain.ProductVariant, 0)
	for rows.Next() {
		var variant domain.ProductVariant
		if err := rows.Scan(
			&variant.ID,
			&variant.ProductID,
			&variant.SKU,
			&variant.Color,
			&variant.Size,
			&variant.PriceOverrideUnits,
			&variant.Active,
		); err != nil {
			return nil, err
		}
		variants = append(variants, variant)
	}
	return variants, rows.Err()
}

func (r *ProductRepository) listImages(ctx context.Context, productID string) ([]domain.ProductImage, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id::text, product_id::text, COALESCE(media_id, ''), url, alt_text, sort_order
		FROM product_images
		WHERE product_id = $1::uuid
		ORDER BY sort_order ASC, created_at ASC`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	images := make([]domain.ProductImage, 0)
	for rows.Next() {
		var image domain.ProductImage
		if err := rows.Scan(&image.ID, &image.ProductID, &image.MediaID, &image.URL, &image.AltText, &image.SortOrder); err != nil {
			return nil, err
		}
		images = append(images, image)
	}
	return images, rows.Err()
}

func (r *ProductRepository) listStocksForProduct(ctx context.Context, productID string) ([]domain.Stock, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id::text, product_id::text, variant_id::text, store_id, quantity, reserved_quantity, updated_at
		FROM stocks
		WHERE product_id = $1::uuid
		ORDER BY store_id ASC`, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	stocks := make([]domain.Stock, 0)
	for rows.Next() {
		stock, err := scanStock(rows)
		if err != nil {
			return nil, err
		}
		stocks = append(stocks, stock)
	}
	return stocks, rows.Err()
}

type rowScanner interface {
	Scan(dest ...any) error
}

func scanProduct(row rowScanner) (domain.Product, error) {
	var product domain.Product
	var isDeleted bool
	err := row.Scan(
		&product.ID,
		&product.StoreID,
		&product.CategoryID,
		&product.TitleUz,
		&product.DescriptionUz,
		&product.Brand,
		&product.PriceUnits,
		&product.CurrencyCode,
		&product.DiscountPercent,
		&product.Status,
		&isDeleted,
		&product.CreatedAt,
		&product.UpdatedAt,
	)
	_ = isDeleted
	return product, err
}

func scanStock(row rowScanner) (domain.Stock, error) {
	var stock domain.Stock
	err := row.Scan(
		&stock.ID,
		&stock.ProductID,
		&stock.VariantID,
		&stock.StoreID,
		&stock.Quantity,
		&stock.ReservedQuantity,
		&stock.UpdatedAt,
	)
	return stock, err
}

func scanCategory(row rowScanner) (domain.Category, error) {
	var category domain.Category
	err := row.Scan(&category.ID, &category.ParentID, &category.Slug, &category.NameUz, &category.DescriptionUz, &category.SortOrder)
	return category, err
}
