package uz.nasibashop.orders.health;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

import org.apache.kafka.clients.admin.AdminClient;
import org.apache.kafka.clients.admin.AdminClientConfig;
import org.apache.kafka.clients.admin.DescribeClusterResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

@Component("kafka")
public class KafkaClusterHealthIndicator implements HealthIndicator {

    private final String bootstrapServers;

    public KafkaClusterHealthIndicator(
            @Value("${spring.kafka.bootstrap-servers:}") String bootstrapServers) {
        this.bootstrapServers = bootstrapServers != null ? bootstrapServers.trim() : "";
    }

    @Override
    public Health health() {
        if (bootstrapServers.isEmpty()) {
            return Health.up()
                    .withDetail("kafka", Map.of("status", "SKIPPED", "reason", "empty bootstrap-servers"))
                    .build();
        }
        Map<String, Object> cfg = new HashMap<>();
        cfg.put(AdminClientConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        cfg.put(AdminClientConfig.REQUEST_TIMEOUT_MS_CONFIG, 2000);
        cfg.put(AdminClientConfig.DEFAULT_API_TIMEOUT_MS_CONFIG, 2000);
        try (AdminClient client = AdminClient.create(cfg)) {
            DescribeClusterResult result = client.describeCluster();
            String clusterId = result.clusterId().get(3, TimeUnit.SECONDS);
            return Health.up()
                    .withDetail("kafka", Map.of("status", "UP", "clusterId", clusterId != null ? clusterId : "unknown"))
                    .build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Health.down(e)
                    .withDetail("kafka", Map.of("status", "DOWN", "error", "interrupted"))
                    .build();
        } catch (TimeoutException | ExecutionException e) {
            Throwable cause = e instanceof ExecutionException ? e.getCause() : e;
            String msg = cause != null ? cause.getMessage() : e.getMessage();
            return Health.down(e)
                    .withDetail("kafka", Map.of("status", "DOWN", "error", msg != null ? msg : "timeout"))
                    .build();
        } catch (Exception e) {
            return Health.down(e)
                    .withDetail("kafka", Map.of("status", "DOWN", "error", e.getMessage() != null ? e.getMessage() : "error"))
                    .build();
        }
    }
}
