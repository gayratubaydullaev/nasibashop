package service

import (
	"bytes"
	"context"
	"errors"
	"image/jpeg"
	"image/png"
	"io"
	"log/slog"
	"strconv"
	"strings"
	"time"

	"github.com/chai2010/webp"
	"github.com/disintegration/imaging"
	"github.com/nasibashop/nasibashop/services/media-service/internal/config"
	"github.com/nasibashop/nasibashop/services/media-service/internal/kafka"
	"github.com/nasibashop/nasibashop/services/media-service/internal/repository"
	"github.com/nasibashop/nasibashop/services/media-service/internal/storage"
	_ "golang.org/x/image/webp" // image.Decode / imaging: webp o‘qish
)

type MediaService struct {
	cfg    config.Config
	repo   *repository.Repository
	store  storage.Store
	pub    *kafka.Publisher
	logger *slog.Logger
}

func NewMediaService(cfg config.Config, repo *repository.Repository, store storage.Store, pub *kafka.Publisher, logger *slog.Logger) *MediaService {
	return &MediaService{cfg: cfg, repo: repo, store: store, pub: pub, logger: logger}
}

func (s *MediaService) Upload(ctx context.Context, filename string, contentType string, r io.Reader) (repository.MediaRow, error) {
	data, err := io.ReadAll(io.LimitReader(r, s.cfg.MaxUploadBytes+1))
	if err != nil {
		return repository.MediaRow{}, err
	}
	if int64(len(data)) > s.cfg.MaxUploadBytes {
		return repository.MediaRow{}, errors.New("file too large")
	}
	if len(data) == 0 {
		return repository.MediaRow{}, errors.New("empty file")
	}

	ct := normalizeContentType(contentType, data)
	if !isRaster(ct) {
		return repository.MediaRow{}, errors.New("unsupported content type (images only)")
	}

	img, err := imaging.Decode(bytes.NewReader(data), imaging.AutoOrientation(true))
	if err != nil {
		return repository.MediaRow{}, errors.New("invalid image")
	}
	b := img.Bounds()
	w, h := b.Dx(), b.Dy()

	id := repository.NewUUID()
	key := storage.ObjectKey(id)
	if err := s.store.Put(ctx, key, data, ct); err != nil {
		return repository.MediaRow{}, err
	}

	row := repository.MediaRow{
		ID:               id,
		ContentType:      ct,
		OriginalFilename: filename,
		SizeBytes:        int64(len(data)),
		StorageKey:       key,
		Width:            w,
		Height:           h,
		Blurhash:         "",
	}
	if err := s.repo.Insert(ctx, row); err != nil {
		_ = s.store.Delete(ctx, key)
		return repository.MediaRow{}, err
	}

	ts := time.Now().UTC().Format(time.RFC3339Nano)
	s.pub.Publish(ctx, s.cfg.TopicUploaded, id, map[string]any{
		"mediaId": id, "contentType": ct, "sizeBytes": len(data), "width": w, "height": h, "timestamp": ts,
	})
	s.pub.Publish(ctx, s.cfg.TopicProcessed, id, map[string]any{
		"mediaId": id, "variants": []string{"original"}, "timestamp": ts,
	})

	return row, nil
}

func (s *MediaService) GetBytes(ctx context.Context, id string, width, height int, format string) ([]byte, string, error) {
	row, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, "", err
	}
	raw, err := s.store.Get(ctx, row.StorageKey)
	if err != nil {
		return nil, "", err
	}

	if width <= 0 && height <= 0 && format == "" {
		return raw, row.ContentType, nil
	}
	if !isRaster(row.ContentType) {
		return raw, row.ContentType, nil
	}

	img, err := imaging.Decode(bytes.NewReader(raw), imaging.AutoOrientation(true))
	if err != nil {
		return raw, row.ContentType, nil
	}
	fw := capDim(width, 4096)
	fh := capDim(height, 4096)
	if fw > 0 || fh > 0 {
		img = imaging.Fit(img, fw, fh, imaging.Lanczos)
	}

	f := strings.ToLower(strings.TrimSpace(format))
	if f == "" {
		f = extFromContentType(row.ContentType)
	}

	var buf bytes.Buffer
	var outCT string
	switch f {
	case "webp":
		outCT = "image/webp"
		if err := webp.Encode(&buf, img, &webp.Options{Lossless: false, Quality: 82}); err != nil {
			return nil, "", err
		}
	case "png":
		outCT = "image/png"
		if err := png.Encode(&buf, img); err != nil {
			return nil, "", err
		}
	default:
		outCT = "image/jpeg"
		if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 85}); err != nil {
			return nil, "", err
		}
	}
	return buf.Bytes(), outCT, nil
}

func (s *MediaService) Delete(ctx context.Context, id string) error {
	row, err := s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}
	if err := s.store.Delete(ctx, row.StorageKey); err != nil {
		s.logger.Warn("storage delete failed", "key", row.StorageKey, "error", err)
	}
	return nil
}

func capDim(d, max int) int {
	if d <= 0 {
		return 0
	}
	if d > max {
		return max
	}
	return d
}

func normalizeContentType(header string, sniff []byte) string {
	h := strings.TrimSpace(strings.ToLower(header))
	if h != "" && !strings.Contains(h, "application/octet-stream") {
		return strings.Split(h, ";")[0]
	}
	if len(sniff) >= 3 && sniff[0] == 0xFF && sniff[1] == 0xD8 {
		return "image/jpeg"
	}
	if len(sniff) >= 8 && string(sniff[0:8]) == "\x89PNG\r\n\x1a\n" {
		return "image/png"
	}
	if len(sniff) >= 12 && string(sniff[0:4]) == "RIFF" && string(sniff[8:12]) == "WEBP" {
		return "image/webp"
	}
	return header
}

func isRaster(ct string) bool {
	ct = strings.ToLower(ct)
	return strings.Contains(ct, "jpeg") || strings.Contains(ct, "jpg") ||
		strings.Contains(ct, "png") || strings.Contains(ct, "webp")
}

func extFromContentType(ct string) string {
	ct = strings.ToLower(ct)
	switch {
	case strings.Contains(ct, "png"):
		return "png"
	case strings.Contains(ct, "webp"):
		return "webp"
	default:
		return "jpeg"
	}
}

func ParseIntQuery(s string) int {
	n, _ := strconv.Atoi(strings.TrimSpace(s))
	return n
}
