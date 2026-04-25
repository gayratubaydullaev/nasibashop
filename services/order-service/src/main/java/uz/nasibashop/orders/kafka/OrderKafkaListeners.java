package uz.nasibashop.orders.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import uz.nasibashop.orders.service.OrderService;

@Component
@RequiredArgsConstructor
public class OrderKafkaListeners {
    private final OrderService orderService;

    @KafkaListener(topics = "${app.kafka.topics.stock-reserved:stock.reserved}")
    public void onStockReserved(String payload) {
        JsonNode node = orderService.readTree(payload);
        orderService.onStockReserved(node);
    }

    @KafkaListener(topics = "${app.kafka.topics.payment-completed:payment.completed}")
    public void onPaymentCompleted(String payload) {
        JsonNode node = orderService.readTree(payload);
        orderService.onPaymentCompleted(node);
    }
}
