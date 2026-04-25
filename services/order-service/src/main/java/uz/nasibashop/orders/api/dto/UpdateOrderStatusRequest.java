package uz.nasibashop.orders.api.dto;

import jakarta.validation.constraints.NotNull;
import uz.nasibashop.orders.domain.OrderStatus;

public record UpdateOrderStatusRequest(@NotNull OrderStatus status, String reason, String changedBy) {}
