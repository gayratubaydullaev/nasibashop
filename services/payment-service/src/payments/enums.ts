export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentProviderKind {
  PAYME = 'PAYME',
  CLICK = 'CLICK',
  UZCARD = 'UZCARD',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}
