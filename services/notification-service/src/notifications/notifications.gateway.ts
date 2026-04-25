import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/ws/notifications', cors: { origin: '*' } })
export class NotificationsGateway {
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { userId?: string; storeId?: string },
  ): { ok: boolean } {
    if (body?.userId) {
      void client.join(`user:${body.userId}`);
      this.logger.debug(`socket ${client.id} joined user:${body.userId}`);
    }
    if (body?.storeId) {
      void client.join(`store:${body.storeId}`);
      this.logger.debug(`socket ${client.id} joined store:${body.storeId}`);
    }
    return { ok: true };
  }

  emitNotification(payload: {
    title: string;
    body: string;
    topic: string;
    userId?: string;
    storeId?: string;
    id: string;
    createdAt: Date;
  }): void {
    const event = 'notification';
    if (payload.userId) {
      this.server.to(`user:${payload.userId}`).emit(event, payload);
    }
    if (payload.storeId) {
      this.server.to(`store:${payload.storeId}`).emit(event, payload);
    }
    if (!payload.userId && !payload.storeId) {
      this.server.emit(event, payload);
    }
  }
}
