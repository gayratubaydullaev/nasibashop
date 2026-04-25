package uz.nasibashop.orders.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record CreateOrderItemRequest(
        @NotNull UUID productId,
        @NotNull UUID variantId,
        @NotBlank String sku,
        @NotBlank String titleUz,
        @Min(1) int quantity,
        @Min(0) long unitPriceUnits) {}
