package uz.nasibashop.orders.api;

import java.util.Comparator;
import java.util.List;
import uz.nasibashop.orders.api.dto.DeliveryAddressResponse;
import uz.nasibashop.orders.api.dto.OrderItemResponse;
import uz.nasibashop.orders.api.dto.OrderResponse;
import uz.nasibashop.orders.api.dto.OrderStatusHistoryResponse;
import uz.nasibashop.orders.persistence.OrderEntity;
import uz.nasibashop.orders.persistence.OrderItemEntity;
import uz.nasibashop.orders.persistence.OrderStatusHistoryEntity;

public final class OrderMapper {
    private OrderMapper() {}

    public static OrderResponse toResponse(OrderEntity order) {
        DeliveryAddressResponse delivery = null;
        if (order.getDeliveryRegion() != null) {
            delivery = new DeliveryAddressResponse(
                    order.getDeliveryRegion(),
                    order.getDeliveryDistrict(),
                    order.getDeliveryStreet(),
                    order.getDeliveryHouse(),
                    order.getDeliveryApartment(),
                    order.getDeliveryLandmark(),
                    order.getDeliveryLatitude(),
                    order.getDeliveryLongitude());
        }

        List<OrderItemResponse> items =
                order.getItems().stream()
                        .sorted(
                                Comparator.comparing(OrderItemEntity::getCreatedAt)
                                        .thenComparing(OrderItemEntity::getSku))
                        .map(OrderMapper::toItemResponse)
                        .toList();

        List<OrderStatusHistoryResponse> history =
                order.getStatusHistory().stream()
                        .sorted(Comparator.comparing(OrderStatusHistoryEntity::getChangedAt))
                        .map(
                                row ->
                                        new OrderStatusHistoryResponse(
                                                row.getOldStatus(),
                                                row.getNewStatus(),
                                                row.getChangedBy(),
                                                row.getReason(),
                                                row.getChangedAt()))
                        .toList();

        return new OrderResponse(
                order.getId(),
                order.getUserId(),
                order.getStoreId(),
                order.getStatus(),
                order.getFulfillmentType(),
                order.getPaymentMethod(),
                order.getSubtotalUnits(),
                order.getDeliveryFeeUnits(),
                order.getDiscountTotalUnits(),
                order.getTotalUnits(),
                order.getCurrencyCode(),
                delivery,
                order.getPickupStoreId(),
                order.getPaymentId(),
                order.getDeliveryId(),
                items,
                history,
                order.getCreatedAt(),
                order.getUpdatedAt());
    }

    private static OrderItemResponse toItemResponse(OrderItemEntity item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProductId(),
                item.getVariantId(),
                item.getSku(),
                item.getTitleUz(),
                item.getQuantity(),
                item.getReservedQuantity(),
                item.getUnitPriceUnits(),
                item.getTotalPriceUnits());
    }
}
