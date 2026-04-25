package repository

import (
	"context"
	"sort"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/nasibashop/nasibashop/services/product-service/internal/domain"
)

type CategoryRepository struct {
	db *pgxpool.Pool
}

func NewCategoryRepository(db *pgxpool.Pool) *CategoryRepository {
	return &CategoryRepository{db: db}
}

func (r *CategoryRepository) ListTree(ctx context.Context) ([]domain.Category, error) {
	rows, err := r.db.Query(ctx, `
		SELECT id::text, COALESCE(parent_id::text, ''), slug, name_uz, COALESCE(description_uz, ''), sort_order
		FROM categories
		ORDER BY parent_id NULLS FIRST, sort_order ASC, name_uz ASC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	flat := make([]domain.Category, 0)
	for rows.Next() {
		var category domain.Category
		if err := rows.Scan(&category.ID, &category.ParentID, &category.Slug, &category.NameUz, &category.DescriptionUz, &category.SortOrder); err != nil {
			return nil, err
		}
		flat = append(flat, category)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return buildCategoryTree(flat), nil
}

func (r *CategoryRepository) Create(ctx context.Context, category domain.Category) (domain.Category, error) {
	const query = `
		INSERT INTO categories (id, parent_id, slug, name_uz, description_uz, sort_order)
		VALUES ($1::uuid, NULLIF($2, '')::uuid, $3, $4, NULLIF($5, ''), $6)
		RETURNING id::text, COALESCE(parent_id::text, ''), slug, name_uz, COALESCE(description_uz, ''), sort_order`

	return scanCategory(r.db.QueryRow(ctx, query, category.ID, category.ParentID, category.Slug, category.NameUz, category.DescriptionUz, category.SortOrder))
}

func buildCategoryTree(flat []domain.Category) []domain.Category {
	nodes := make(map[string]*domain.Category, len(flat))
	order := make([]string, 0, len(flat))

	for _, item := range flat {
		item := item
		item.Children = nil
		nodes[item.ID] = &item
		order = append(order, item.ID)
	}

	roots := make([]*domain.Category, 0)
	for _, id := range order {
		node := nodes[id]
		if node.ParentID == "" {
			roots = append(roots, node)
			continue
		}
		parent, ok := nodes[node.ParentID]
		if !ok {
			roots = append(roots, node)
			continue
		}
		parent.Children = append(parent.Children, *node)
	}

	result := make([]domain.Category, 0, len(roots))
	for _, root := range roots {
		sortCategoryChildren(root)
		result = append(result, *root)
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].SortOrder == result[j].SortOrder {
			return result[i].NameUz < result[j].NameUz
		}
		return result[i].SortOrder < result[j].SortOrder
	})

	return result
}

func sortCategoryChildren(node *domain.Category) {
	sort.Slice(node.Children, func(i, j int) bool {
		if node.Children[i].SortOrder == node.Children[j].SortOrder {
			return node.Children[i].NameUz < node.Children[j].NameUz
		}
		return node.Children[i].SortOrder < node.Children[j].SortOrder
	})
	for i := range node.Children {
		sortCategoryChildren(&node.Children[i])
	}
}
