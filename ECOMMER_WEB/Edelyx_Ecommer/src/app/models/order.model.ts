export interface OrderItem {
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
  status: string;
  createdAt: string;
  items: OrderItem[];
}
