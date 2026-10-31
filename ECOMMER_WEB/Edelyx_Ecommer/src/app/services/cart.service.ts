import { computed, effect, Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';
import { CartItem } from '../models/cart-item.model';

const STORAGE_KEY = 'edelyx_cart';

export interface CartActionResult {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class CartService {
  // Estado base reactivo hidratado desde localStorage
  private readonly itemsSignal = signal<CartItem[]>(this.loadFromStorage());

  // Visibilidad reactiva del Drawer lateral
  readonly isDrawerOpen = signal<boolean>(false);

  // Mensaje temporal de validación de stock
  readonly stockNotice = signal<string | null>(null);
  private stockNoticeTimer: ReturnType<typeof setTimeout> | null = null;

  // Signals públicos y computados
  readonly items = this.itemsSignal.asReadonly();

  readonly totalItems = computed(() =>
    this.itemsSignal().reduce((acc, item) => acc + item.quantity, 0),
  );

  // Alias retrocompatible para consumidores existentes
  readonly cartCount = this.totalItems;

  readonly totalAmount = computed(() => {
    const rawTotal = this.itemsSignal().reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0,
    );
    return Math.round(rawTotal * 100) / 100;
  });

  constructor() {
    // Sincronización automática con localStorage ('edelyx_cart')
    effect(() => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.itemsSignal()));
        }
      } catch (err) {
        console.error('Error al sincronizar edelyx_cart en localStorage:', err);
      }
    });
  }

  openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this.isDrawerOpen.set(false);
    this.clearStockNotice();
  }

  toggleDrawer(): void {
    this.isDrawerOpen.update((open) => !open);
  }

  getItemQuantity(productId: number): number {
    return this.itemsSignal().find((item) => item.product.id === productId)?.quantity ?? 0;
  }

  // Agrega un producto validando estrictamente quantity <= product.stock
  addItem(product: Product, quantityToAdd: number = 1): CartActionResult {
    if (quantityToAdd <= 0) {
      return { success: false, message: 'La cantidad debe ser mayor a cero.' };
    }

    if (product.stock <= 0) {
      const msg = `"${product.name}" se encuentra agotado.`;
      this.notifyStockLimit(msg);
      return { success: false, message: msg };
    }

    const current = this.itemsSignal();
    const existing = current.find((item) => item.product.id === product.id);

    if (existing) {
      const nextQuantity = existing.quantity + quantityToAdd;
      if (nextQuantity > product.stock) {
        const msg = `Stock máximo alcanzado para "${product.name}" (${product.stock} disponibles).`;
        this.notifyStockLimit(msg);
        return { success: false, message: msg };
      }

      this.itemsSignal.update((items) =>
        items.map((item) =>
          item.product.id === product.id ? { product, quantity: nextQuantity } : item,
        ),
      );
      this.clearStockNotice();

      return {
        success: true,
        message: `Cantidad actualizada: ${nextQuantity} pzas de "${product.name}".`,
      };
    }

    if (quantityToAdd > product.stock) {
      const msg = `Solo hay ${product.stock} unidades disponibles de "${product.name}".`;
      this.notifyStockLimit(msg);
      return { success: false, message: msg };
    }

    this.itemsSignal.update((items) => [...items, { product, quantity: quantityToAdd }]);
    this.clearStockNotice();

    return {
      success: true,
      message: `"${product.name}" agregado al carrito.`,
    };
  }

  // Modifica la cantidad de un ítem respetando 1 <= quantity <= product.stock
  updateQuantity(productId: number, delta: number): CartActionResult {
    const item = this.itemsSignal().find((entry) => entry.product.id === productId);
    if (!item) {
      return { success: false, message: 'El producto no existe en el carrito.' };
    }

    const targetQuantity = item.quantity + delta;

    if (targetQuantity <= 0) {
      this.removeItem(productId);
      this.clearStockNotice();
      return { success: true, message: 'Producto eliminado del carrito.' };
    }

    if (targetQuantity > item.product.stock) {
      const msg = `Límite de inventario: máximo ${item.product.stock} unidades para "${item.product.name}".`;
      this.notifyStockLimit(msg);
      return { success: false, message: msg };
    }

    this.itemsSignal.update((items) =>
      items.map((entry) =>
        entry.product.id === productId ? { ...entry, quantity: targetQuantity } : entry,
      ),
    );
    this.clearStockNotice();

    return { success: true, message: `Cantidad actualizada a ${targetQuantity}.` };
  }

  removeItem(productId: number): void {
    this.itemsSignal.update((items) => items.filter((entry) => entry.product.id !== productId));
    this.clearStockNotice();
  }

  clearCart(): void {
    this.itemsSignal.set([]);
    this.clearStockNotice();
  }

  private notifyStockLimit(message: string): void {
    this.stockNotice.set(message);
    if (this.stockNoticeTimer) {
      clearTimeout(this.stockNoticeTimer);
    }
    this.stockNoticeTimer = setTimeout(() => {
      this.stockNotice.set(null);
      this.stockNoticeTimer = null;
    }, 3200);
  }

  private clearStockNotice(): void {
    if (this.stockNoticeTimer) {
      clearTimeout(this.stockNoticeTimer);
      this.stockNoticeTimer = null;
    }
    this.stockNotice.set(null);
  }

  private loadFromStorage(): CartItem[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];

        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
          .filter(
            (entry): entry is CartItem =>
              Boolean(entry) &&
              typeof entry === 'object' &&
              'product' in entry &&
              Boolean(entry.product) &&
              typeof entry.product.id === 'number' &&
              typeof entry.product.price === 'number' &&
              typeof entry.product.stock === 'number' &&
              typeof entry.quantity === 'number' &&
              entry.product.stock > 0 &&
              entry.quantity >= 1,
          )
          .map((entry) => ({
            product: entry.product,
            quantity: Math.min(Math.floor(entry.quantity), entry.product.stock),
          }));
      }
    } catch (err) {
      console.warn('No se pudo hidratar edelyx_cart desde localStorage:', err);
    }
    return [];
  }
}
