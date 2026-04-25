package uz.nasibashop.orders.api;

import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import uz.nasibashop.orders.api.dto.CancelOrderRequest;
import uz.nasibashop.orders.api.dto.CreateOrderRequest;
import uz.nasibashop.orders.api.dto.OrderResponse;
import uz.nasibashop.orders.api.dto.UpdateOrderStatusRequest;
import uz.nasibashop.orders.domain.OrderStatus;
import uz.nasibashop.orders.persistence.OrderEntity;
import uz.nasibashop.orders.service.OrderService;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Validated
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse create(@Valid @RequestBody CreateOrderRequest request) {
        OrderEntity created = orderService.createOrder(request);
        return OrderMapper.toResponse(orderService.getOrder(created.getId()));
    }

    @GetMapping
    public Page<OrderResponse> listAll(
            @RequestParam(required = false) OrderStatus status, Pageable pageable) {
        return orderService.listAllOrders(status, pageable).map(OrderMapper::toResponse);
    }

    @GetMapping("/{id}")
    public OrderResponse get(@PathVariable UUID id) {
        return OrderMapper.toResponse(orderService.getOrder(id));
    }

    @GetMapping("/my")
    public Page<OrderResponse> my(
            @RequestParam String userId, Pageable pageable) {
        Page<OrderEntity> page = orderService.listMyOrders(userId, pageable);
        return page.map(OrderMapper::toResponse);
    }

    @GetMapping("/store/{storeId}")
    public Page<OrderResponse> store(
            @PathVariable String storeId,
            @RequestParam(required = false) OrderStatus status,
            Pageable pageable) {
        Page<OrderEntity> page = orderService.listStoreOrders(storeId, status, pageable);
        return page.map(OrderMapper::toResponse);
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(@PathVariable UUID id, @Valid @RequestBody UpdateOrderStatusRequest request) {
        OrderEntity updated = orderService.updateStatus(id, request);
        return OrderMapper.toResponse(updated);
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancel(@PathVariable UUID id, @RequestBody(required = false) CancelOrderRequest request) {
        CancelOrderRequest safeRequest = request == null ? new CancelOrderRequest("") : request;
        OrderEntity cancelled = orderService.cancelOrder(id, safeRequest);
        return OrderMapper.toResponse(cancelled);
    }
}
