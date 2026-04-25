import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Dev stubs: wire Eskiz / SMTP / FCM via env in production. */
@Injectable()
export class ChannelDispatcherService {
  private readonly logger = new Logger(ChannelDispatcherService.name);

  constructor(private readonly config: ConfigService) {}

  async dispatch(channels: string[] | undefined, payload: { title: string; body: string; userId?: string }): Promise<void> {
    const list = channels?.length ? channels : ['ws'];
    for (const ch of list) {
      switch (ch) {
        case 'email':
          await this.sendEmailStub(payload);
          break;
        case 'sms':
          await this.sendSmsStub(payload);
          break;
        case 'push':
          await this.sendPushStub(payload);
          break;
        default:
          break;
      }
    }
  }

  private async sendEmailStub(payload: { title: string; body: string; userId?: string }): Promise<void> {
    if (!this.config.get<string>('SMTP_HOST')) {
      this.logger.verbose(`[email stub] to user=${payload.userId} ${payload.title}`);
      return;
    }
    this.logger.warn('SMTP_HOST is set but email sender is not implemented in this stub');
  }

  private async sendSmsStub(payload: { title: string; body: string; userId?: string }): Promise<void> {
    this.logger.verbose(`[sms stub] user=${payload.userId} ${payload.title}`);
  }

  private async sendPushStub(payload: { title: string; body: string; userId?: string }): Promise<void> {
    if (!this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON')) {
      this.logger.verbose(`[fcm stub] user=${payload.userId} ${payload.title}`);
      return;
    }
    this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON is set but FCM sender is not implemented in this stub');
  }
}
