import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CategoryService } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';

export interface PriceRangeOption {
  id: string;
  label: string;
  min: number;
  max: number;
}

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly cartService = inject(CartService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Datos crudos desde el microservicio de Catálogo
  private readonly rawProducts = signal<Product[]>([]);

  // Signals principales del Catálogo
  categories = signal<Category[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Paginación y Parámetros de Ruta
  currentPage = signal<number>(0);
  pageSize = signal<number>(9);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);
  selectedCategoryId = signal<number | undefined>(undefined);
  searchQuery = signal<string>('');

  // Filtros Laterales (Blueprint: Filtro.png) y Ordenamiento (ORDENAR)
  freeShippingOnly = signal<boolean>(false);
  selectedPriceRange = signal<string>('ALL');
  minRating = signal<number>(0);
  sortBy = signal<string>('FEATURED');

  // Interacciones de Tarjeta (Wishlist & Feedback de Carrito)
  wishlistIds = signal<number[]>([]);
  recentlyAddedId = signal<number | null>(null);
  showMobileFilters = signal<boolean>(false);

  readonly priceHistogramBars = [28, 42, 55, 68, 84, 76, 92, 64, 50, 38];

  readonly priceRanges: PriceRangeOption[] = [
    { id: 'ALL', label: 'Todos los precios', min: 0, max: Infinity },
    { id: 'UNDER_1000', label: 'Hasta $1,000', min: 0, max: 1000 },
    { id: '1000_2600', label: '$1,000 a $2,600', min: 1000, max: 2600 },
    { id: '2600_5000', label: '$2,600 a $5,000', min: 2600, max: 5000 },
    { id: 'OVER_5000', label: '$5,000 y más', min: 5000, max: Infinity },
  ];

  // Signal computado `products()` consumido directamente por catalog.component.html
  products = computed<Product[]>(() => {
    let list = [...this.rawProducts()];
    const query = this.searchQuery().trim().toLowerCase();
    const range = this.priceRanges.find((r) => r.id === this.selectedPriceRange());
    const minStars = this.minRating();
    const onlyFree = this.freeShippingOnly();

    if (query) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.categoryName.toLowerCase().includes(query),
      );
    }

    if (onlyFree) {
      list = list.filter((p) => this.isFreeShippingEligible(p));
    }

    if (range && range.id !== 'ALL') {
      list = list.filter((p) => p.price >= range.min && p.price <= range.max);
    }

    if (minStars > 0) {
      list = list.filter((p) => this.getProductRatingValue(p) >= minStars);
    }

    switch (this.sortBy()) {
      case 'PRICE_ASC':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'PRICE_DESC':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'RATING_DESC':
        list.sort((a, b) => this.getProductRatingValue(b) - this.getProductRatingValue(a));
        break;
      case 'NAME_ASC':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return list;
  });

  activeCategoryName = computed<string>(() => {
    const id = this.selectedCategoryId();
    if (!id) return 'Catálogo Oficial';
    return this.categories().find((c) => c.id === id)?.name ?? 'Categoría Seleccionada';
  });

  activePriceLabel = computed<string>(() => {
    return (
      this.priceRanges.find((r) => r.id === this.selectedPriceRange())?.label ??
      '$349 – $19,000 y más'
    );
  });

  hasActiveFilters = computed<boolean>(() => {
    return (
      this.selectedCategoryId() !== undefined ||
      this.searchQuery().trim().length > 0 ||
      this.freeShippingOnly() ||
      this.selectedPriceRange() !== 'ALL' ||
      this.minRating() > 0
    );
  });

  pageNumbers = computed<number[]>(() => {
    const total = Math.max(this.totalPages(), 1);
    return Array.from({ length: total }, (_, idx) => idx);
  });

  ngOnInit(): void {
    this.loadCategories();

    this.route.queryParams.subscribe((params) => {
      const categoryId = params['category'] ? Number(params['category']) : undefined;
      const query = params['q'] ? String(params['q']) : '';
      this.selectedCategoryId.set(categoryId);
      this.searchQuery.set(query);
      this.currentPage.set(0);
      this.loadProducts();
    });
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => this.categories.set(cats),
      error: (err) => console.error('Error al cargar categorías en Catálogo:', err),
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productService
      .getProducts(this.currentPage(), this.pageSize(), this.selectedCategoryId())
      .subscribe({
        next: (page) => {
          this.rawProducts.set(page.content);
          this.totalElements.set(page.totalElements);
          this.totalPages.set(page.totalPages);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar catálogo:', err);
          this.errorMessage.set(
            'No se pudo conectar con el microservicio de catálogo. Verifica que el API Gateway (8080) esté activo.',
          );
          this.isLoading.set(false);
        },
      });
  }

  selectCategory(categoryId?: number): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: categoryId ?? null },
      queryParamsHandling: 'merge',
    });
  }

  toggleMobileFilters(): void {
    this.showMobileFilters.update((open) => !open);
  }

  toggleFreeShipping(): void {
    this.freeShippingOnly.update((val) => !val);
  }

  setPriceRange(rangeId: string): void {
    this.selectedPriceRange.set(rangeId);
  }

  setMinRating(stars: number): void {
    this.minRating.update((current) => (current === stars ? 0 : stars));
  }

  setSortBy(value: string): void {
    this.sortBy.set(value);
  }

  clearAllFilters(): void {
    this.freeShippingOnly.set(false);
    this.selectedPriceRange.set('ALL');
    this.minRating.set(0);
    this.sortBy.set('FEATURED');
    this.router.navigate(['/'], { queryParams: {} });
  }

  toggleWishlist(productId: number): void {
    this.wishlistIds.update((ids) =>
      ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId],
    );
  }

  isWishlisted(productId: number): boolean {
    return this.wishlistIds().includes(productId);
  }

  addToCart(product: Product): void {
    if (product.stock <= 0) return;
    this.cartService.addItem(product);
    this.recentlyAddedId.set(product.id);
    setTimeout(() => {
      if (this.recentlyAddedId() === product.id) {
        this.recentlyAddedId.set(null);
      }
    }, 1100);
  }

  isRecentlyAdded(productId: number): boolean {
    return this.recentlyAddedId() === productId;
  }

  // Formateo editorial de precios estilo $2,848⁰² (sin errores de redondeo)
  getPriceInteger(price: number): string {
    const [intPart] = (price ?? 0).toFixed(2).split('.');
    return Number(intPart).toLocaleString('es-MX');
  }

  getPriceCents(price: number): string {
    const [, decPart = '00'] = (price ?? 0).toFixed(2).split('.');
    return decPart;
  }

  getMonthlyInstallment(price: number): string {
    return ((price ?? 0) / 12).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  isFreeShippingEligible(product: Product): boolean {
    return product.price >= 299;
  }

  getProductRatingValue(product: Product): number {
    const scores = [5.0, 4.9, 4.8, 5.0, 4.7];
    return scores[product.id % scores.length];
  }

  getProductRating(product: Product): string {
    return this.getProductRatingValue(product).toFixed(1);
  }

  getReviewCount(product: Product): number {
    return 14 + ((product.id * 43) % 190);
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages() && page !== this.currentPage()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage() + 1 < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadProducts();
    }
  }

  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.loadProducts();
    }
  }
}
