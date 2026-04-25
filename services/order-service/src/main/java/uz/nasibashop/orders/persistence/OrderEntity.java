package uz.nasibashop.orders.persistence;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import uz.nasibashop.orders.domain.FulfillmentType;
import uz.nasibashop.orders.domain.OrderStatus;
import uz.nasibashop.orders.domain.PaymentMethod;

@Getter
@Setter
@Entity
@Table(name = "orders")
public class OrderEntity {
    @Id
    private UUID id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private String storeId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FulfillmentType fulfillmentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentMethod paymentMethod;

    @Column(nullable = false)
    private long subtotalUnits;

    @Column(nullable = false)
    private long deliveryFeeUnits;

    @Column(nullable = false)
    private long discountTotalUnits;

    @Column(nullable = false)
    private long totalUnits;

    @Column(nullable = false)
    private String currencyCode;

    @Column private String deliveryRegion;
    @Column private String deliveryDistrict;
    @Column private String deliveryStreet;
    @Column private String deliveryHouse;
    @Column private String deliveryApartment;
    @Column private String deliveryLandmark;
    @Column private Double deliveryLatitude;
    @Column private Double deliveryLongitude;

    @Column private String pickupStoreId;

    @Column private UUID paymentId;

    @Column private UUID deliveryId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderItemEntity> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<OrderStatusHistoryEntity> statusHistory = new ArrayList<>();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SagaTransactionEntity> sagaTransactions = new ArrayList<>();

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
