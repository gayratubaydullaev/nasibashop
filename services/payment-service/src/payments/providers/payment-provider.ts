import { PaymentEntity } from '../entities/payment.entity';

export type PaymentProviderResult = {
  externalId: string;
  redirectUrl?: string;
  raw: Record<string, unknown>;
};

export type PaymentStatusResult = {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  raw: Record<string, unknown>;
};

export type RefundResult = {
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  raw: Record<string, unknown>;
};

export interface PaymentProvider {
  createPayment(payment: PaymentEntity): Promise<PaymentProviderResult>;
  checkStatus(transactionId: string): Promise<PaymentStatusResult>;
  refund(transactionId: string, amount: number): Promise<RefundResult>;
}
