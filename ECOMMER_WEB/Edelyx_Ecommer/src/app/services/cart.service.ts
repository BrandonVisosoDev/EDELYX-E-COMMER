import { computed, Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

export interface CartEntry {
  product: Product;
  quantity: number;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly itemsSignal = signal<CartEntry[]>([]);

  readonly items = this.itemsSignal.asReadonly();
  readonly cartCount = computed(() =>
    this.itemsSignal().reduce((acc, entry) => acc + entry.quantity, 0),
  );

  addItem(product: Product): void {
    this.itemsSignal.update((current) => {
      const existing = current.find((entry) => entry.product.id === product.id);
      if (existing) {
        return current.map((entry) =>
          entry.product.id === product.id ? { ...entry, quantity: entry.quantity + 1 } : entry,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }
}
