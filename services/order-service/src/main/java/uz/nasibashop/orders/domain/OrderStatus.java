package uz.nasibashop.orders.domain;

public enum OrderStatus {
    NEW,
    CONFIRMED,
    PREPARING,
    SHIPPED,
    READY_FOR_PICKUP,
    DELIVERED,
    PICKED_UP,
    CANCELLED
}
