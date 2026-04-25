import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, EachMessagePayload, Kafka, logLevel } from 'kafkajs';
import { NotificationsService } from './notifications.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka?: Kafka;
  private consumer?: Consumer;

  constructor(
    private readonly config: ConfigService,
    private readonly notifications: NotificationsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const brokers = (this.config.get<string>('KAFKA_BROKERS') ?? '127.0.0.1:9094')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (!brokers.length) {
      this.logger.warn('KAFKA_BROKERS not set; Kafka consumer disabled');
      return;
    }

    const clientId = this.config.get<string>('KAFKA_CLIENT_ID', 'notification-service');
    const groupId = this.config.get<string>('KAFKA_GROUP_ID', 'notification-service');

    this.kafka = new Kafka({ clientId, brokers, logLevel: logLevel.NOTHING });
    this.consumer = this.kafka.consumer({ groupId });

    const topics = [
      this.config.get<string>('KAFKA_TOPIC_ORDER_CREATED', 'order.created'),
      this.config.get<string>('KAFKA_TOPIC_ORDER_STATUS', 'order.status.changed'),
      this.config.get<string>('KAFKA_TOPIC_PAYMENT_COMPLETED', 'payment.completed'),
      this.config.get<string>('KAFKA_TOPIC_ORDER_CONFIRMED', 'order.confirmed'),
      this.config.get<string>('KAFKA_TOPIC_ORDER_CANCELLED', 'order.cancelled'),
    ];

    await this.consumer.connect();
    await this.consumer.subscribe({ topics, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const raw = payload.message.value?.toString('utf8') ?? '{}';
          const data = JSON.parse(raw) as Record<string, unknown>;
          await this.notifications.handleKafkaEvent(payload.topic, data);
        } catch (e) {
          this.logger.error(`Kafka handler failed topic=${payload.topic}`, e as Error);
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
  }
}
