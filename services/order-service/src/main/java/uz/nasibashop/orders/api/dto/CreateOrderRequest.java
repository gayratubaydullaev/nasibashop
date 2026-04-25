package uz.nasibashop.orders.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import uz.nasibashop.orders.domain.FulfillmentType;
import uz.nasibashop.orders.domain.PaymentMethod;

public record CreateOrderRequest(
        @NotBlank String userId,
        @NotBlank String storeId,
        @NotNull FulfillmentType fulfillmentType,
        @NotNull PaymentMethod paymentMethod,
        @NotEmpty @Valid List<CreateOrderItemRequest> items,
        @Valid DeliveryAddressRequest deliveryAddress,
        String pickupStoreId) {}
