package uz.nasibashop.orders.api.dto;

import java.util.UUID;

public record OrderItemResponse(
        UUID id,
        UUID productId,
        UUID variantId,
        String sku,
        String titleUz,
        int quantity,
        int reservedQuantity,
        long unitPriceUnits,
        long totalPriceUnits) {}
