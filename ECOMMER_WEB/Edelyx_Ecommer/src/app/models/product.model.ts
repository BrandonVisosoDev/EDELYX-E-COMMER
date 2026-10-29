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
