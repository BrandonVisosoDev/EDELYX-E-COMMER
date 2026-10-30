import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './catalog.component.html',
})
export class CatalogComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);

  // Estados Reactivos con Signals
  products = signal<Product[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Paginación
  currentPage = signal<number>(0);
  pageSize = signal<number>(8);
  totalElements = signal<number>(0);
  totalPages = signal<number>(0);
  selectedCategoryId = signal<number | undefined>(undefined);

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const categoryId = params['category'] ? Number(params['category']) : undefined;
      this.selectedCategoryId.set(categoryId);
      this.currentPage.set(0); // Reiniciar a la primera página
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productService
      .getProducts(this.currentPage(), this.pageSize(), this.selectedCategoryId())
      .subscribe({
        next: (page) => {
          this.products.set(page.content);
          this.totalElements.set(page.totalElements);
          this.totalPages.set(page.totalPages);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error al cargar catálogo:', err);
          this.errorMessage.set(
            'No se pudo conectar con el catálogo. Verifica que el backend esté encendido.',
          );
          this.isLoading.set(false);
        },
      });
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
