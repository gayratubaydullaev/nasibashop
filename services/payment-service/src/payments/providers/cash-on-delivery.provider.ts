import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentEntity } from '../entities/payment.entity';
import {
  PaymentProvider,
  PaymentProviderResult,
  PaymentStatusResult,
  RefundResult,
} from './payment-provider';

@Injectable()
export class CashOnDeliveryProvider implements PaymentProvider {
  async createPayment(payment: PaymentEntity): Promise<PaymentProviderResult> {
    const externalId = `COD_${payment.id}_${randomUUID()}`;
    return {
      externalId,
      raw: { provider: 'CASH_ON_DELIVERY', mode: 'dev_stub' },
    };
  }

  async checkStatus(transactionId: string): Promise<PaymentStatusResult> {
    return {
      status: 'PENDING',
      raw: { provider: 'CASH_ON_DELIVERY', transactionId, mode: 'dev_stub' },
    };
  }

  async refund(transactionId: string, amount: number): Promise<RefundResult> {
    return {
      status: 'COMPLETED',
      raw: { provider: 'CASH_ON_DELIVERY', transactionId, amount, mode: 'dev_stub' },
    };
  }
}
