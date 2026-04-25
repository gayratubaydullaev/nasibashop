import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';
import { ChannelDispatcherService } from './channel-dispatcher.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationEntity } from './schemas/notification.schema';

function str(v: unknown): string | undefined {
  if (v === null || v === undefined) return undefined;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return undefined;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(NotificationEntity.name) private readonly model: Model<NotificationEntity>,
    private readonly gateway: NotificationsGateway,
    private readonly channels: ChannelDispatcherService,
  ) {}

  async handleKafkaEvent(topic: string, data: Record<string, unknown>): Promise<void> {
    const orderId = str(data.orderId);
    const userId = str(data.userId);
    const storeId = str(data.storeId);
    let title = 'NasibaShop';
    let body = 'Yangi hodisa';

    if (topic.endsWith('order.created')) {
      title = 'Buyurtma yaratildi';
      body = orderId ? `Buyurtma #${orderId} yaratildi.` : 'Yangi buyurtma.';
    } else if (topic.endsWith('order.status.changed')) {
      const newStatus = str(data.newStatus) ?? '';
      title = 'Buyurtma holati';
      body = orderId ? `Buyurtma #${orderId}: yangi holat — ${newStatus}.` : `Holat o‘zgardi: ${newStatus}.`;
    } else if (topic.endsWith('payment.completed')) {
      title = 'To‘lov';
      body = orderId ? `Buyurtma #${orderId}: to‘lov qabul qilindi.` : 'To‘lov qabul qilindi.';
    } else if (topic.endsWith('order.confirmed')) {
      title = 'Buyurtma tasdiqlandi';
      body = orderId ? `Buyurtma #${orderId} tasdiqlandi.` : 'Buyurtma tasdiqlandi.';
    } else if (topic.endsWith('order.cancelled')) {
      title = 'Buyurtma bekor qilindi';
      const reason = str(data.reason) ?? '';
      body = orderId ? `Buyurtma #${orderId} bekor qilindi. ${reason}`.trim() : 'Buyurtma bekor qilindi.';
    } else {
      this.logger.debug(`ignored topic ${topic}`);
      return;
    }

    await this.persistAndEmit({
      topic,
      title,
      body,
      userId,
      storeId,
      sourcePayload: data,
      channels: ['ws'],
    });
  }

  async sendManual(input: {
    userId?: string;
    storeId?: string;
    title: string;
    body: string;
    topic?: string;
    channels?: string[];
  }): Promise<HydratedDocument<NotificationEntity>> {
    return this.persistAndEmit({
      topic: input.topic ?? 'manual',
      title: input.title,
      body: input.body,
      userId: input.userId,
      storeId: input.storeId,
      sourcePayload: {},
      channels: input.channels,
    });
  }

  private async persistAndEmit(input: {
    topic: string;
    title: string;
    body: string;
    userId?: string;
    storeId?: string;
    sourcePayload: Record<string, unknown>;
    channels?: string[];
  }): Promise<HydratedDocument<NotificationEntity>> {
    const doc = await this.model.create({
      topic: input.topic,
      title: input.title,
      body: input.body,
      userId: input.userId,
      storeId: input.storeId,
      sourcePayload: input.sourcePayload,
    });

    const createdAt = (doc.get('createdAt') as Date | undefined) ?? new Date();
    this.gateway.emitNotification({
      id: doc.id,
      title: doc.title,
      body: doc.body,
      topic: doc.topic,
      userId: doc.userId,
      storeId: doc.storeId,
      createdAt,
    });

    await this.channels.dispatch(input.channels, {
      title: doc.title,
      body: doc.body,
      userId: doc.userId,
    });

    return doc;
  }

  async listHistory(params: {
    userId?: string;
    storeId?: string;
    limit: number;
    offset: number;
  }): Promise<{ items: NotificationEntity[]; total: number }> {
    const filter: Record<string, unknown> = {};
    if (params.userId) filter.userId = params.userId;
    if (params.storeId) filter.storeId = params.storeId;

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(params.offset)
        .limit(params.limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { items: items as NotificationEntity[], total };
  }
}
