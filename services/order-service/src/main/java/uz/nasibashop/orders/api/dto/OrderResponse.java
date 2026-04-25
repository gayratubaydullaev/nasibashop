package uz.nasibashop.orders.api.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import uz.nasibashop.orders.domain.FulfillmentType;
import uz.nasibashop.orders.domain.OrderStatus;
import uz.nasibashop.orders.domain.PaymentMethod;

public record OrderResponse(
        UUID id,
        String userId,
        String storeId,
        OrderStatus status,
        FulfillmentType fulfillmentType,
        PaymentMethod paymentMethod,
        long subtotalUnits,
        long deliveryFeeUnits,
        long discountTotalUnits,
        long totalUnits,
        String currencyCode,
        DeliveryAddressResponse deliveryAddress,
        String pickupStoreId,
        UUID paymentId,
        UUID deliveryId,
        List<OrderItemResponse> items,
        List<OrderStatusHistoryResponse> statusHistory,
        Instant createdAt,
        Instant updatedAt) {}
