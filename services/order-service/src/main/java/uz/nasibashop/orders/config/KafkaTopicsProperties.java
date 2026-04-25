package uz.nasibashop.orders.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "app.kafka.topics")
public class KafkaTopicsProperties {
    private String orderCreated = "order.created";
    private String orderConfirmed = "order.confirmed";
    private String orderStatusChanged = "order.status.changed";
    private String orderCancelled = "order.cancelled";
    private String paymentCreated = "payment.created";
    private String stockReserved = "stock.reserved";
    private String paymentCompleted = "payment.completed";
}
