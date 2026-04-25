package uz.nasibashop.orders.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

@Getter
@Setter
@Entity
@Table(name = "order_items")
public class OrderItemEntity {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private OrderEntity order;

    @Column(nullable = false)
    private UUID productId;

    @Column(nullable = false)
    private UUID variantId;

    @Column(nullable = false)
    private String sku;

    @Column(nullable = false)
    private String titleUz;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private long unitPriceUnits;

    @Column(nullable = false)
    private long totalPriceUnits;

    @Column(nullable = false)
    private int reservedQuantity;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = Instant.now();
        if (reservedQuantity < 0) {
            reservedQuantity = 0;
        }
    }
}
