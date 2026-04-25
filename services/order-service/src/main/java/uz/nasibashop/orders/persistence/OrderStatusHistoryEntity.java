package uz.nasibashop.orders.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import uz.nasibashop.orders.domain.OrderStatus;

@Getter
@Setter
@Entity
@Table(name = "order_status_history")
public class OrderStatusHistoryEntity {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus newStatus;

    @Column private String changedBy;

    @Column private String reason;

    @Column(nullable = false, updatable = false)
    private Instant changedAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        if (changedAt == null) {
            changedAt = Instant.now();
        }
    }
}
