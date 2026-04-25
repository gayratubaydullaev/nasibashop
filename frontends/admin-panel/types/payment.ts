export type PaymentRow = {
  id: string;
  orderId: string;
  status: string;
  provider: string;
  amountUnits: string;
  currencyCode: string;
  redirectUrl?: string;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
};

export type PagePaymentResponse = {
  content: PaymentRow[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};
