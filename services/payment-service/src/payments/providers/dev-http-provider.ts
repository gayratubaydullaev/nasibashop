import { randomUUID } from 'crypto';
import { PaymentEntity } from '../entities/payment.entity';
import {
  PaymentProvider,
  PaymentProviderResult,
  PaymentStatusResult,
  RefundResult,
} from './payment-provider';

export abstract class DevHttpProvider implements PaymentProvider {
  protected abstract name(): string;

  async createPayment(payment: PaymentEntity): Promise<PaymentProviderResult> {
    const externalId = `${this.name()}_${randomUUID()}`;
    const redirectUrl = `https://checkout.dev/${this.name().toLowerCase()}?paymentId=${payment.id}`;
    return {
      externalId,
      redirectUrl,
      raw: { provider: this.name(), mode: 'dev_stub' },
    };
  }

  async checkStatus(transactionId: string): Promise<PaymentStatusResult> {
    return {
      status: 'PROCESSING',
      raw: { provider: this.name(), transactionId, mode: 'dev_stub' },
    };
  }

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    return {
      status: 'COMPLETED',
      raw: { provider: this.name(), transactionId, amount, mode: 'dev_stub' },
    };
  }
}
