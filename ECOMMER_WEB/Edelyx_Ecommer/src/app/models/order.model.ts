export type OrderStatus =
  | 'CREATED'
  | 'CONFIRMED'
  | 'PENDING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
}

export interface Order {
  id?: number;
  orderNumber: string;
  customerEmail: string;
  totalAmount: number;
  status: OrderStatus | string;
  createdAt: string;
  items: OrderItem[];
}

export interface CreateOrderItemPayload {
  productId: number;
  quantity: number;
}

export interface CreateOrderPayload {
  customerEmail: string;
  items: CreateOrderItemPayload[];
}
