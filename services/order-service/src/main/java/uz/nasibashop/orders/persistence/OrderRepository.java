package uz.nasibashop.orders.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import uz.nasibashop.orders.domain.OrderStatus;

public interface OrderRepository extends JpaRepository<OrderEntity, UUID> {
    @EntityGraph(attributePaths = {"items", "statusHistory"})
    @Query("SELECT o FROM OrderEntity o WHERE o.id = :id")
    Optional<OrderEntity> findDetailById(@Param("id") UUID id);

    Page<OrderEntity> findAllByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    @Query(
            """
            SELECT o FROM OrderEntity o
            WHERE o.storeId = :storeId
              AND (:status IS NULL OR o.status = :status)
            ORDER BY o.createdAt DESC
            """)
    Page<OrderEntity> findAllForStore(
            @Param("storeId") String storeId, @Param("status") OrderStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"items", "statusHistory"})
    @Query(
            """
            SELECT o FROM OrderEntity o
            WHERE (:status IS NULL OR o.status = :status)
            ORDER BY o.createdAt DESC
            """)
    Page<OrderEntity> findAllForAdmin(@Param("status") OrderStatus status, Pageable pageable);
}
