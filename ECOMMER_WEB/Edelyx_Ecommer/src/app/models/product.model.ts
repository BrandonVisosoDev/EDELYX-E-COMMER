export interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  description: string;
  imageUrl: string;
  categoryId: number;
  categoryName: string;
}

export interface ProductPayload {
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: number;
}
