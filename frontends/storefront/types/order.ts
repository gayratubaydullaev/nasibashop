/** order-service + Spring Data Page (camelCase). */

export type OrderItemResponse = {
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  titleUz: string;
  quantity: number;
  reservedQuantity: number;
  unitPriceUnits: number;
  totalPriceUnits: number;
};

export type DeliveryAddressResponse = {
  region?: string | null;
  district?: string | null;
  street?: string | null;
  house?: string | null;
  apartment?: string | null;
  landmark?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type OrderDetailResponse = {
  id: string;
  userId: string;
  storeId: string;
  status: string;
  fulfillmentType: string;
  paymentMethod: string;
  subtotalUnits: number;
  deliveryFeeUnits: number;
  discountTotalUnits: number;
  totalUnits: number;
  currencyCode: string;
  deliveryAddress?: DeliveryAddressResponse | null;
  pickupStoreId?: string | null;
  items?: OrderItemResponse[];
  createdAt: string;
  updatedAt?: string;
};

export type PageOrderResponse = {
  content: OrderDetailResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};
