package uz.nasibashop.orders.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import uz.nasibashop.orders.api.dto.CancelOrderRequest;
import uz.nasibashop.orders.api.dto.CreateOrderItemRequest;
import uz.nasibashop.orders.api.dto.CreateOrderRequest;
import uz.nasibashop.orders.api.dto.DeliveryAddressRequest;
import uz.nasibashop.orders.api.dto.UpdateOrderStatusRequest;
import uz.nasibashop.orders.domain.FulfillmentType;
import uz.nasibashop.orders.domain.OrderStatus;
import uz.nasibashop.orders.domain.PaymentMethod;
import uz.nasibashop.orders.domain.SagaStatus;
import uz.nasibashop.orders.domain.SagaStepType;
import uz.nasibashop.orders.persistence.OrderEntity;
import uz.nasibashop.orders.persistence.OrderItemEntity;
import uz.nasibashop.orders.persistence.OrderRepository;
import uz.nasibashop.orders.persistence.OrderStatusHistoryEntity;
import uz.nasibashop.orders.persistence.SagaTransactionEntity;
import uz.nasibashop.orders.persistence.SagaTransactionRepository;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderRepository orderRepository;
    private final SagaTransactionRepository sagaTransactionRepository;
    private final KafkaEventPublisher kafkaEventPublisher;
    private final ObjectMapper objectMapper;

    @Transactional
    public OrderEntity createOrder(CreateOrderRequest request) {
        validateCreateRequest(request);

        OrderEntity order = new OrderEntity();
        order.setUserId(request.userId());
        order.setStoreId(request.storeId());
        order.setFulfillmentType(request.fulfillmentType());
        order.setPaymentMethod(request.paymentMethod());
        order.setCurrencyCode("UZS");
        order.setStatus(OrderStatus.NEW);

        if (request.fulfillmentType() == FulfillmentType.DELIVERY) {
            applyDeliveryAddress(order, request.deliveryAddress());
        } else {
            if (request.pickupStoreId() == null || request.pickupStoreId().isBlank()) {
                throw new IllegalArgumentException("pickupStoreId is required for pickup fulfillment");
            }
            order.setPickupStoreId(request.pickupStoreId());
        }

        long subtotal = 0;
        List<OrderItemEntity> items = new ArrayList<>();
        for (CreateOrderItemRequest line : request.items()) {
            long lineTotal = line.unitPriceUnits() * line.quantity();
            subtotal += lineTotal;

            OrderItemEntity item = new OrderItemEntity();
            item.setOrder(order);
            item.setProductId(line.productId());
            item.setVariantId(line.variantId());
            item.setSku(line.sku());
            item.setTitleUz(line.titleUz());
            item.setQuantity(line.quantity());
            item.setUnitPriceUnits(line.unitPriceUnits());
            item.setTotalPriceUnits(lineTotal);
            item.setReservedQuantity(0);
            items.add(item);
        }

        order.setSubtotalUnits(subtotal);
        order.setDiscountTotalUnits(0);
        order.setDeliveryFeeUnits(request.fulfillmentType() == FulfillmentType.DELIVERY ? 0 : 0);
        order.setTotalUnits(subtotal + order.getDeliveryFeeUnits() - order.getDiscountTotalUnits());

        order.getItems().clear();
        order.getItems().addAll(items);

        appendStatusHistory(order, OrderStatus.NEW, OrderStatus.NEW, "system", "order created");
        upsertSagaStep(order, SagaStepType.RESERVE_STOCK, SagaStatus.PENDING, null);

        OrderEntity saved = orderRepository.save(order);

        afterCommit(
                () -> {
                    kafkaEventPublisher.publish(
                            kafkaEventPublisher.topics().getOrderCreated(),
                            saved.getId().toString(),
                            buildOrderCreatedPayload(saved));
                });

        return saved;
    }

    @Transactional(readOnly = true)
    public OrderEntity getOrder(UUID id) {
        return orderRepository
                .findDetailById(id)
                .orElseThrow(() -> new NotFoundException("order not found"));
    }

    @Transactional(readOnly = true)
    public Page<OrderEntity> listMyOrders(String userId, Pageable pageable) {
        return orderRepository.findAllByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Transactional(readOnly = true)
    public Page<OrderEntity> listStoreOrders(String storeId, OrderStatus status, Pageable pageable) {
        return orderRepository.findAllForStore(storeId, status, pageable);
    }

    /** Barcha buyurtmalar (admin / super-admin); keyinroq JWT/RBAC bilan himoyalash tavsiya etiladi. */
    @Transactional(readOnly = true)
    public Page<OrderEntity> listAllOrders(OrderStatus status, Pageable pageable) {
        return orderRepository.findAllForAdmin(status, pageable);
    }

    @Transactional
    public OrderEntity updateStatus(UUID id, UpdateOrderStatusRequest request) {
        OrderEntity order = getOrder(id);
        OrderStatus old = order.getStatus();
        if (old == OrderStatus.CANCELLED) {
            throw new IllegalStateException("order is cancelled");
        }

        order.setStatus(request.status());
        appendStatusHistory(order, old, request.status(), safe(request.changedBy()), safe(request.reason()));
        OrderEntity saved = orderRepository.save(order);

        afterCommit(
                () ->
                        kafkaEventPublisher.publish(
                                kafkaEventPublisher.topics().getOrderStatusChanged(),
                                saved.getId().toString(),
                                Map.of(
                                        "orderId", saved.getId().toString(),
                                        "oldStatus", old.name(),
                                        "newStatus", saved.getStatus().name(),
                                        "timestamp", Instant.now())));

        return saved;
    }

    @Transactional
    public OrderEntity cancelOrder(UUID id, CancelOrderRequest request) {
        OrderEntity order = getOrder(id);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return order;
        }
        if (order.getStatus() == OrderStatus.DELIVERED || order.getStatus() == OrderStatus.PICKED_UP) {
            throw new IllegalStateException("cannot cancel completed order");
        }

        OrderStatus old = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED);
        appendStatusHistory(order, old, OrderStatus.CANCELLED, "system", safe(request.reason()));

        markSagaFailed(order, SagaStepType.RESERVE_STOCK);
        markSagaFailed(order, SagaStepType.CREATE_PAYMENT);
        markSagaFailed(order, SagaStepType.CONFIRM_ORDER);

        OrderEntity saved = orderRepository.save(order);

        afterCommit(
                () ->
                        kafkaEventPublisher.publish(
                                kafkaEventPublisher.topics().getOrderCancelled(),
                                saved.getId().toString(),
                                buildOrderCancelledPayload(saved, safe(request.reason()))));

        return saved;
    }

    @Transactional
    public void onStockReserved(JsonNode payload) {
        UUID orderId = UUID.fromString(payload.path("orderId").asText());
        UUID variantId = UUID.fromString(payload.path("variantId").asText());
        int qty = payload.path("quantity").asInt(0);
        if (qty <= 0) {
            return;
        }

        OrderEntity order = getOrder(orderId);
        OrderItemEntity line = findLine(order, variantId);
        line.setReservedQuantity(Math.min(line.getQuantity(), line.getReservedQuantity() + qty));

        boolean allReserved =
                order.getItems().stream().allMatch(item -> item.getReservedQuantity() >= item.getQuantity());
        if (allReserved) {
            upsertSagaStep(order, SagaStepType.RESERVE_STOCK, SagaStatus.COMPLETED, payload.toString());
            maybeStartPayment(order);
        }

        orderRepository.save(order);
    }

    @Transactional
    public void onPaymentCompleted(JsonNode payload) {
        UUID orderId = UUID.fromString(payload.path("orderId").asText());
        OrderEntity order = getOrder(orderId);

        upsertSagaStep(order, SagaStepType.CREATE_PAYMENT, SagaStatus.COMPLETED, payload.toString());

        OrderStatus old = order.getStatus();
        order.setStatus(OrderStatus.CONFIRMED);
        appendStatusHistory(order, old, OrderStatus.CONFIRMED, "payment-service", "payment completed");
        upsertSagaStep(order, SagaStepType.CONFIRM_ORDER, SagaStatus.COMPLETED, payload.toString());

        OrderEntity saved = orderRepository.save(order);

        afterCommit(
                () -> {
                    kafkaEventPublisher.publish(
                            kafkaEventPublisher.topics().getOrderConfirmed(),
                            saved.getId().toString(),
                            buildOrderConfirmedPayload(saved));
                    kafkaEventPublisher.publish(
                            kafkaEventPublisher.topics().getOrderStatusChanged(),
                            saved.getId().toString(),
                            Map.of(
                                    "orderId", saved.getId().toString(),
                                    "oldStatus", old.name(),
                                    "newStatus", saved.getStatus().name(),
                                    "timestamp", Instant.now()));
                });
    }

    private void maybeStartPayment(OrderEntity order) {
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return;
        }

        var existing = sagaTransactionRepository.findByOrder_IdAndStepType(order.getId(), SagaStepType.CREATE_PAYMENT);
        if (existing.isPresent() && existing.get().getStatus() == SagaStatus.COMPLETED) {
            return;
        }

        UUID paymentId = UUID.randomUUID();
        order.setPaymentId(paymentId);

        upsertSagaStep(order, SagaStepType.CREATE_PAYMENT, SagaStatus.PENDING, null);

        OrderEntity saved = orderRepository.save(order);

        afterCommit(
                () ->
                        kafkaEventPublisher.publish(
                                kafkaEventPublisher.topics().getPaymentCreated(),
                                paymentId.toString(),
                                Map.of(
                                        "paymentId", paymentId.toString(),
                                        "orderId", saved.getId().toString(),
                                        "userId", saved.getUserId(),
                                        "storeId", saved.getStoreId(),
                                        "amount", saved.getTotalUnits(),
                                        "currency", saved.getCurrencyCode(),
                                        "method", saved.getPaymentMethod().name(),
                                        "timestamp", Instant.now())));
    }

    private OrderItemEntity findLine(OrderEntity order, UUID variantId) {
        return order.getItems().stream()
                .filter(item -> item.getVariantId().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("variant not part of order"));
    }

    private void validateCreateRequest(CreateOrderRequest request) {
        if (request.fulfillmentType() == FulfillmentType.DELIVERY && request.deliveryAddress() == null) {
            throw new IllegalArgumentException("deliveryAddress is required for delivery fulfillment");
        }
    }

    private void applyDeliveryAddress(OrderEntity order, DeliveryAddressRequest address) {
        if (address == null) {
            return;
        }
        order.setDeliveryRegion(address.region());
        order.setDeliveryDistrict(address.district());
        order.setDeliveryStreet(address.street());
        order.setDeliveryHouse(address.house());
        order.setDeliveryApartment(address.apartment());
        order.setDeliveryLandmark(address.landmark());
        order.setDeliveryLatitude(address.latitude());
        order.setDeliveryLongitude(address.longitude());
    }

    private void appendStatusHistory(
            OrderEntity order, OrderStatus oldStatus, OrderStatus newStatus, String changedBy, String reason) {
        OrderStatusHistoryEntity row = new OrderStatusHistoryEntity();
        row.setOrder(order);
        row.setOldStatus(oldStatus);
        row.setNewStatus(newStatus);
        row.setChangedBy(changedBy);
        row.setReason(reason);
        order.getStatusHistory().add(row);
    }

    private void upsertSagaStep(OrderEntity order, SagaStepType stepType, SagaStatus status, String payloadJson) {
        SagaTransactionEntity row =
                sagaTransactionRepository
                        .findByOrder_IdAndStepType(order.getId(), stepType)
                        .orElseGet(
                                () -> {
                                    SagaTransactionEntity created = new SagaTransactionEntity();
                                    created.setOrder(order);
                                    created.setStepType(stepType);
                                    return created;
                                });

        row.setStatus(status);
        row.setPayloadJson(payloadJson);
        sagaTransactionRepository.save(row);
    }

    private void markSagaFailed(OrderEntity order, SagaStepType stepType) {
        sagaTransactionRepository
                .findByOrder_IdAndStepType(order.getId(), stepType)
                .ifPresent(
                        row -> {
                            if (row.getStatus() == SagaStatus.PENDING) {
                                row.setStatus(SagaStatus.FAILED);
                                sagaTransactionRepository.save(row);
                            }
                        });
    }

    private Map<String, Object> buildOrderConfirmedPayload(OrderEntity order) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", order.getId().toString());
        payload.put("userId", order.getUserId());
        payload.put("storeId", order.getStoreId());
        payload.put("fulfillmentType", order.getFulfillmentType().name());
        payload.put("currency", order.getCurrencyCode());
        payload.put("totalUnits", order.getTotalUnits());
        payload.put("deliveryFeeUnits", order.getDeliveryFeeUnits());
        payload.put("timestamp", Instant.now());
        if (order.getPickupStoreId() != null && !order.getPickupStoreId().isBlank()) {
            payload.put("pickupStoreId", order.getPickupStoreId());
        }
        if (order.getDeliveryRegion() != null) {
            payload.put("deliveryRegion", order.getDeliveryRegion());
        }
        if (order.getDeliveryDistrict() != null) {
            payload.put("deliveryDistrict", order.getDeliveryDistrict());
        }
        if (order.getDeliveryStreet() != null) {
            payload.put("deliveryStreet", order.getDeliveryStreet());
        }
        if (order.getDeliveryHouse() != null) {
            payload.put("deliveryHouse", order.getDeliveryHouse());
        }
        if (order.getDeliveryApartment() != null) {
            payload.put("deliveryApartment", order.getDeliveryApartment());
        }
        if (order.getDeliveryLandmark() != null) {
            payload.put("deliveryLandmark", order.getDeliveryLandmark());
        }
        if (order.getDeliveryLatitude() != null) {
            payload.put("deliveryLatitude", order.getDeliveryLatitude());
        }
        if (order.getDeliveryLongitude() != null) {
            payload.put("deliveryLongitude", order.getDeliveryLongitude());
        }
        return payload;
    }

    private Map<String, Object> buildOrderCreatedPayload(OrderEntity order) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (OrderItemEntity item : order.getItems()) {
            items.add(
                    Map.of(
                            "productId", item.getProductId().toString(),
                            "variantId", item.getVariantId().toString(),
                            "quantity", item.getQuantity()));
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("orderId", order.getId().toString());
        payload.put("userId", order.getUserId());
        payload.put("storeId", order.getStoreId());
        payload.put("items", items);
        payload.put("totalAmount", order.getTotalUnits());
        payload.put("currency", order.getCurrencyCode());
        payload.put("timestamp", Instant.now());
        return payload;
    }

    private Map<String, Object> buildOrderCancelledPayload(OrderEntity order, String reason) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (OrderItemEntity item : order.getItems()) {
            int qty = item.getReservedQuantity() > 0 ? item.getReservedQuantity() : item.getQuantity();
            items.add(Map.of("variantId", item.getVariantId().toString(), "quantity", qty));
        }

        return Map.of(
                "orderId", order.getId().toString(),
                "storeId", order.getStoreId(),
                "reason", reason,
                "items", items,
                "timestamp", Instant.now());
    }

    private void afterCommit(Runnable runnable) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            runnable.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(
                new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        runnable.run();
                    }
                });
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    public JsonNode readTree(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            throw new IllegalArgumentException("invalid kafka json");
        }
    }
}
