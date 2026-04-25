package uz.nasibashop.orders.api.dto;

public record DeliveryAddressResponse(
        String region,
        String district,
        String street,
        String house,
        String apartment,
        String landmark,
        Double latitude,
        Double longitude) {}
