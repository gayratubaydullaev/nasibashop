package uz.nasibashop.orders.persistence;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import uz.nasibashop.orders.domain.SagaStatus;
import uz.nasibashop.orders.domain.SagaStepType;

public interface SagaTransactionRepository extends JpaRepository<SagaTransactionEntity, UUID> {
    Optional<SagaTransactionEntity> findByOrder_IdAndStepType(UUID orderId, SagaStepType stepType);

    List<SagaTransactionEntity> findAllByOrder_Id(UUID orderId);
}
