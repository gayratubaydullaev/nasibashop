import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentRefundEntity } from './entities/payment-refund.entity';
import { PaymentLogEntity } from './entities/payment-log.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymeProvider } from './providers/payme.provider';
import { ClickProvider } from './providers/click.provider';
import { UzcardProvider } from './providers/uzcard.provider';
import { CashOnDeliveryProvider } from './providers/cash-on-delivery.provider';
import { PaymentProviderFactory } from './providers/payment-provider.factory';
import { PaymentsProcessor } from './payments.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([PaymentEntity, PaymentTransactionEntity, PaymentRefundEntity, PaymentLogEntity]),
    BullModule.registerQueue({ name: 'payments' }),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentsProcessor,
    PaymentProviderFactory,
    PaymeProvider,
    ClickProvider,
    UzcardProvider,
    CashOnDeliveryProvider,
  ],
})
export class PaymentsModule {}
