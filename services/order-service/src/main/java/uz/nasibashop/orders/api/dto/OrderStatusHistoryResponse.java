package uz.nasibashop.orders.api.dto;

import java.time.Instant;
import uz.nasibashop.orders.domain.OrderStatus;

public record OrderStatusHistoryResponse(
        OrderStatus oldStatus, OrderStatus newStatus, String changedBy, String reason, Instant changedAt) {}
