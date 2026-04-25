import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bullmq';
import { Consumer, EachMessagePayload, Kafka, logLevel, Producer } from 'kafkajs';
import { FindOptionsWhere, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentEntity } from './entities/payment.entity';
import { PaymentLogEntity } from './entities/payment-log.entity';
import { PaymentRefundEntity } from './entities/payment-refund.entity';
import { PaymentTransactionEntity } from './entities/payment-transaction.entity';
import { PaymentProviderKind, PaymentStatus } from './enums';
import { PaymentProviderFactory } from './providers/payment-provider.factory';

type PaymentCreatedPayload = {
  paymentId?: string;
  orderId: string;
  userId: string;
  storeId: string;
  amount: number;
  currency: string;
  method: string;
};

type OrderCancelledPayload = {
  orderId: string;
  reason?: string;
};

@Injectable()
export class PaymentsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentsService.name);
  private kafka?: Kafka;
  private consumer?: Consumer;
  private producer?: Producer;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(PaymentEntity) private readonly paymentsRepo: Repository<PaymentEntity>,
    @InjectRepository(PaymentTransactionEntity)
    private readonly txRepo: Repository<PaymentTransactionEntity>,
    @InjectRepository(PaymentRefundEntity) private readonly refundsRepo: Repository<PaymentRefundEntity>,
    @InjectRepository(PaymentLogEntity) private readonly logsRepo: Repository<PaymentLogEntity>,
    private readonly providers: PaymentProviderFactory,
    @InjectQueue('payments') private readonly paymentsQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    const brokers = (this.config.get<string>('KAFKA_BROKERS') ?? 'localhost:9094')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (brokers.length === 0) {
      this.logger.warn('KAFKA_BROKERS not set; Kafka consumer disabled');
      return;
    }

    const clientId = this.config.get<string>('KAFKA_CLIENT_ID') ?? 'payment-service';
    const groupId = this.config.get<string>('KAFKA_GROUP_ID') ?? 'payment-service';

    this.kafka = new Kafka({ clientId, brokers, logLevel: logLevel.NOTHING });
    this.consumer = this.kafka.consumer({ groupId });
    this.producer = this.kafka.producer();

    // order-service publishes `payment.created` after stock is reserved; do not consume `order.created` here
    // (avoids duplicate payments and wrong saga timing). Subscribe only to orchestration topics we react to.
    const topics = [
      this.config.get<string>('KAFKA_TOPIC_PAYMENT_CREATED') ?? 'payment.created',
      this.config.get<string>('KAFKA_TOPIC_ORDER_CANCELLED') ?? 'order.cancelled',
    ];

    await this.consumer.connect();
    await this.consumer.subscribe({ topics, fromBeginning: false });
    await this.producer.connect();

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const topic = payload.topic;
          const message = payload.message.value?.toString('utf8') ?? '';
          const data = JSON.parse(message) as unknown;

          if (topic.endsWith('order.cancelled')) {
            await this.onOrderCancelled(data as OrderCancelledPayload);
          } else if (topic.endsWith('payment.created')) {
            await this.onPaymentCreatedSignal(data as PaymentCreatedPayload);
          }
        } catch (e) {
          this.logger.error('Kafka message handling failed', e as Error);
        }
      },
    });

    this.logger.log(`Kafka consumer subscribed: ${topics.join(', ')}`);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.consumer?.disconnect();
    } catch {
      // ignore
    }
    try {
      await this.producer?.disconnect();
    } catch {
      // ignore
    }
  }

  async createPayment(dto: CreatePaymentDto) {
    const existing = await this.paymentsRepo.findOne({ where: { orderId: dto.orderId } });
    if (existing) {
      return { payment: this.toDto(existing), created: false };
    }

    const payment = this.paymentsRepo.create({
      id: randomUUID(),
      orderId: dto.orderId,
      userId: dto.userId,
      storeId: dto.storeId,
      currencyCode: dto.currencyCode,
      amountUnits: dto.amountUnits,
      status: PaymentStatus.PENDING,
      provider: dto.provider,
      metadata: dto.metadata,
    });

    await this.paymentsRepo.save(payment);
    await this.appendTx(payment, 'CREATE', 'PENDING', { dto });
    await this.log(payment, 'INFO', 'payment row created', {});

    await this.startProviderFlow(payment);

    const fresh = await this.paymentsRepo.findOneOrFail({ where: { id: payment.id } });
    return { payment: this.toDto(fresh), created: true };
  }

  async getPaymentStatus(id: string) {
    const payment = await this.paymentsRepo.findOne({ where: { id } });
    if (!payment) {
      return { found: false };
    }
    return { found: true, payment: this.toDto(payment) };
  }

  /** Ro‘yxat (admin); keyinroq JWT/RBAC bilan himoyalash tavsiya etiladi. */
  async listPayments(options: { page?: string; size?: string; status?: string }) {
    const page = Math.max(0, Number.parseInt(options.page ?? '0', 10) || 0);
    const rawSize = Number.parseInt(options.size ?? '20', 10);
    const size = Math.min(100, Math.max(1, Number.isFinite(rawSize) ? rawSize : 20));

    const where: FindOptionsWhere<PaymentEntity> = {};
    const valid = new Set<string>(Object.values(PaymentStatus));
    if (options.status && valid.has(options.status)) {
      where.status = options.status as PaymentStatus;
    }

    const [items, total] = await this.paymentsRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      take: size,
      skip: page * size,
    });

    const totalPages = total === 0 ? 0 : Math.ceil(total / size);

    return {
      content: items.map((p) => this.toDto(p)),
      totalElements: total,
      totalPages,
      size,
      number: page,
      first: page === 0,
      last: totalPages === 0 ? true : page >= totalPages - 1,
    };
  }

  async refundPayment(id: string, body: RefundPaymentDto) {
    const payment = await this.paymentsRepo.findOne({ where: { id } });
    if (!payment) {
      return { ok: false, error: 'not_found' };
    }
    if (payment.status !== PaymentStatus.COMPLETED) {
      return { ok: false, error: 'invalid_state' };
    }

    const provider = this.providers.get(payment.provider);
    const externalId = payment.externalId ?? payment.id;
    const refundResult = await provider.refund(externalId, Number(body.amountUnits));

    const refund = this.refundsRepo.create({
      id: randomUUID(),
      payment,
      amountUnits: body.amountUnits,
      status: refundResult.status,
    });
    await this.refundsRepo.save(refund);

    payment.status = PaymentStatus.REFUNDED;
    await this.paymentsRepo.save(payment);

    await this.appendTx(payment, 'REFUND', refundResult.status, refundResult.raw);
    await this.log(payment, 'INFO', 'refund processed', { refundResult });

    await this.publish('payment.refunded', payment.id, {
      paymentId: payment.id,
      orderId: payment.orderId,
      amountUnits: body.amountUnits,
      currency: payment.currencyCode,
      timestamp: new Date().toISOString(),
    });

    return { ok: true, refund: { id: refund.id, status: refund.status } };
  }

  async handleProviderWebhook(provider: string, body: Record<string, unknown>) {
    const paymentId = String(body.paymentId ?? body.id ?? '');
    if (!paymentId) {
      return { ok: false, error: 'missing_paymentId' };
    }

    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId } });
    if (!payment) {
      return { ok: false, error: 'not_found' };
    }

    await this.appendTx(payment, 'WEBHOOK', 'COMPLETED', { provider, body });
    await this.completePayment(payment, { provider, simulated: false });

    return { ok: true };
  }

  async autoCompletePayment(paymentId: string): Promise<void> {
    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId } });
    if (!payment) {
      return;
    }
    if (payment.status === PaymentStatus.COMPLETED) {
      return;
    }
    await this.completePayment(payment, { simulated: true });
  }

  private async onPaymentCreatedSignal(payload: PaymentCreatedPayload): Promise<void> {
    if (!payload?.orderId) {
      return;
    }

    const existing = await this.paymentsRepo.findOne({ where: { orderId: payload.orderId } });
    if (existing) {
      await this.startProviderFlow(existing);
      return;
    }

    const provider = this.mapMethodToProvider(payload.method);
    const payment = this.paymentsRepo.create({
      id: payload.paymentId ?? randomUUID(),
      orderId: payload.orderId,
      userId: payload.userId,
      storeId: payload.storeId,
      currencyCode: payload.currency ?? 'UZS',
      amountUnits: String(payload.amount ?? 0),
      status: PaymentStatus.PENDING,
      provider,
      metadata: { source: 'kafka:payment.created' },
    });

    await this.paymentsRepo.save(payment);
    await this.appendTx(payment, 'CREATE', 'PENDING', { payload });
    await this.log(payment, 'INFO', 'created from payment.created', {});

    await this.startProviderFlow(payment);
  }

  private async onOrderCancelled(payload: OrderCancelledPayload): Promise<void> {
    if (!payload?.orderId) {
      return;
    }

    const payment = await this.paymentsRepo.findOne({ where: { orderId: payload.orderId } });
    if (!payment) {
      return;
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      const provider = this.providers.get(payment.provider);
      const externalId = payment.externalId ?? payment.id;
      const refund = await provider.refund(externalId, Number(payment.amountUnits));

      const refundRow = this.refundsRepo.create({
        id: randomUUID(),
        payment,
        amountUnits: payment.amountUnits,
        status: refund.status,
      });
      await this.refundsRepo.save(refundRow);

      payment.status = PaymentStatus.REFUNDED;
      await this.paymentsRepo.save(payment);

      await this.appendTx(payment, 'REFUND', refund.status, { payload, refund });
      await this.log(payment, 'INFO', 'auto refund on cancel', {});

      await this.publish('payment.refunded', payment.id, {
        paymentId: payment.id,
        orderId: payment.orderId,
        amountUnits: payment.amountUnits,
        currency: payment.currencyCode,
        reason: payload.reason ?? '',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      return;
    }

    payment.status = PaymentStatus.FAILED;
    await this.paymentsRepo.save(payment);
    await this.appendTx(payment, 'CANCEL', 'FAILED', { payload });
    await this.log(payment, 'WARN', 'cancelled before completion', {});

    await this.publish('payment.failed', payment.id, {
      paymentId: payment.id,
      orderId: payment.orderId,
      reason: payload.reason ?? 'order_cancelled',
      timestamp: new Date().toISOString(),
    });
  }

  private mapMethodToProvider(method?: string): PaymentProviderKind {
    const normalized = (method ?? 'PAYME').toUpperCase();
    if (normalized.includes('CLICK')) return PaymentProviderKind.CLICK;
    if (normalized.includes('UZCARD')) return PaymentProviderKind.UZCARD;
    if (normalized.includes('CASH')) return PaymentProviderKind.CASH_ON_DELIVERY;
    return PaymentProviderKind.PAYME;
  }

  private async startProviderFlow(payment: PaymentEntity): Promise<void> {
    if (payment.externalId) {
      return;
    }

    const provider = this.providers.get(payment.provider);
    const result = await provider.createPayment(payment);

    payment.externalId = result.externalId;
    payment.redirectUrl = result.redirectUrl;
    payment.status =
      payment.provider === PaymentProviderKind.CASH_ON_DELIVERY
        ? PaymentStatus.COMPLETED
        : PaymentStatus.PROCESSING;

    await this.paymentsRepo.save(payment);
    await this.appendTx(payment, 'PROVIDER_CREATE', 'PROCESSING', result.raw);
    await this.log(payment, 'INFO', 'provider session created', { result });

    if (payment.provider === PaymentProviderKind.CASH_ON_DELIVERY) {
      await this.completePayment(payment, { cod: true });
      return;
    }

    const autoComplete = (this.config.get<string>('PAYMENT_AUTO_COMPLETE') ?? 'true') === 'true';
    if (autoComplete) {
      const delayMs = Number(this.config.get<string>('PAYMENT_AUTO_COMPLETE_DELAY_MS') ?? '1500');
      await this.paymentsQueue.add(
        'auto-complete',
        { paymentId: payment.id },
        { delay: Number.isFinite(delayMs) ? delayMs : 1500, removeOnComplete: true, removeOnFail: true },
      );
    }
  }

  private async completePayment(payment: PaymentEntity, meta: Record<string, unknown>): Promise<void> {
    if (payment.status === PaymentStatus.COMPLETED) {
      return;
    }

    payment.status = PaymentStatus.COMPLETED;
    await this.paymentsRepo.save(payment);

    await this.appendTx(payment, 'COMPLETE', 'COMPLETED', meta);
    await this.log(payment, 'INFO', 'payment completed', meta);

    await this.publish('payment.completed', payment.id, {
      paymentId: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      storeId: payment.storeId,
      amount: Number(payment.amountUnits),
      currency: payment.currencyCode,
      method: payment.provider,
      timestamp: new Date().toISOString(),
    });
  }

  private async appendTx(
    payment: PaymentEntity,
    type: string,
    status: string,
    providerPayload: Record<string, unknown>,
  ): Promise<void> {
    const tx = this.txRepo.create({
      id: randomUUID(),
      payment,
      type,
      status,
      providerPayload,
    });
    await this.txRepo.save(tx);
  }

  private async log(payment: PaymentEntity, level: string, message: string, context: Record<string, unknown>) {
    const row = this.logsRepo.create({
      id: randomUUID(),
      payment,
      level,
      message,
      context,
    });
    await this.logsRepo.save(row);
  }

  private async publish(topic: string, key: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.producer) {
      this.logger.warn(`Kafka publish skipped (${topic})`);
      return;
    }

    await this.producer.send({
      topic,
      messages: [{ key, value: JSON.stringify(payload) }],
    });
  }

  private toDto(payment: PaymentEntity) {
    return {
      id: payment.id,
      orderId: payment.orderId,
      status: payment.status,
      provider: payment.provider,
      amountUnits: payment.amountUnits,
      currencyCode: payment.currencyCode,
      redirectUrl: payment.redirectUrl,
      externalId: payment.externalId,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
