import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDocument = HydratedDocument<NotificationEntity>;

@Schema({ timestamps: true, collection: 'notifications' })
export class NotificationEntity {
  @Prop({ required: true })
  topic: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop()
  userId?: string;

  @Prop()
  storeId?: string;

  @Prop({ type: Object })
  sourcePayload?: Record<string, unknown>;
}

export const NotificationSchema = SchemaFactory.createForClass(NotificationEntity);
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ storeId: 1, createdAt: -1 });
