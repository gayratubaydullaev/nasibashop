package uz.nasibashop.orders.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import uz.nasibashop.orders.config.KafkaTopicsProperties;

@Component
@RequiredArgsConstructor
public class KafkaEventPublisher {
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final KafkaTopicsProperties topics;

    public void publish(String topic, String key, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, key, json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize kafka payload", e);
        }
    }

    public KafkaTopicsProperties topics() {
        return topics;
    }
}
