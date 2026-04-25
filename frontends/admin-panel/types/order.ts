/** order-service `OrderStatus` (JSON — odatda UPPER_SNAKE). */
export const ORDER_FLOW_STATUSES = [
  "NEW",
  "CONFIRMED",
  "PREPARING",
  "SHIPPED",
  "READY_FOR_PICKUP",
  "DELIVERED",
  "PICKED_UP",
  "CANCELLED",
] as const;

export type OrderFlowStatus = (typeof ORDER_FLOW_STATUSES)[number];

/** JSON от Spring Data Page + order-service DTO (camelCase). */
export type OrderResponse = {
  id: string;
  userId: string;
  storeId: string;
  status: string;
  fulfillmentType?: string;
  paymentMethod?: string;
  subtotalUnits: number;
  deliveryFeeUnits: number;
  discountTotalUnits: number;
  totalUnits: number;
  currencyCode: string;
  createdAt: string;
  updatedAt?: string;
};

export type PageOrderResponse = {
  content: OrderResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};
