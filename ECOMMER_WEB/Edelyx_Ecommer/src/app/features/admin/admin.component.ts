import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { Category, CategoryPayload } from '../../models/category.model';
import { Product, ProductPayload } from '../../models/product.model';
import { extractApiErrorMessage } from '../../core/utils/http-error.util';

export type AdminTab = 'PRODUCTS' | 'CATEGORIES';

function nonBlankValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value;
  if (val === null || val === undefined) {
    return { notBlank: true };
  }
  return String(val).trim().length > 0 ? null : { notBlank: true };
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  templateUrl: './admin.component.html',
})
export class AdminComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);

  readonly activeTab = signal<AdminTab>('PRODUCTS');

  // Datos desde CatalogService
  readonly categories = signal<Category[]>([]);
  readonly products = signal<Product[]>([]);

  // Paginación y búsqueda en tabla de productos
  readonly currentPage = signal<number>(0);
  readonly pageSize = signal<number>(15);
  readonly totalElements = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly productFilter = signal<string>('');
  readonly categoryFilter = signal<string>('');

  // Estados de carga y operaciones CRUD
  readonly isLoadingData = signal<boolean>(false);
  readonly isSavingProduct = signal<boolean>(false);
  readonly isSavingCategory = signal<boolean>(false);
  readonly deletingId = signal<number | null>(null);
  readonly lastUpdated = signal<string>('');

  // Edición y confirmación de borrado lógico
  readonly editingProductId = signal<number | null>(null);
  readonly editingCategoryId = signal<number | null>(null);
  readonly confirmDeleteProductId = signal<number | null>(null);
  readonly confirmDeleteCategoryId = signal<number | null>(null);
  readonly productSubmitted = signal<boolean>(false);
  readonly categorySubmitted = signal<boolean>(false);
  readonly previewError = signal<boolean>(false);

  // Mensajes de feedback
  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Formulario Reactivo de Categoría (@NotBlank)
  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, nonBlankValidator, Validators.maxLength(100)]],
  });

  // Formulario Reactivo de Producto (@NotBlank, @Positive, @Min(0))
  readonly productForm = this.fb.group({
    sku: ['', [Validators.required, nonBlankValidator, Validators.maxLength(50)]],
    name: ['', [Validators.required, nonBlankValidator, Validators.maxLength(150)]],
    categoryId: [null as number | null, [Validators.required, Validators.min(1)]],
    price: [null as number | null, [Validators.required, Validators.min(0.01)]],
    stock: [0 as number | null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    imageUrl: ['', [Validators.required, nonBlankValidator, Validators.maxLength(500)]],
    description: ['', [Validators.maxLength(1000)]],
  });

  // Filtrado reactivo en memoria sobre la página actual
  readonly filteredProducts = computed(() => {
    const term = this.productFilter().trim().toLowerCase();
    if (!term) return this.products();
    return this.products().filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.categoryName.toLowerCase().includes(term),
    );
  });

  readonly filteredCategories = computed(() => {
    const term = this.categoryFilter().trim().toLowerCase();
    if (!term) return this.categories();
    return this.categories().filter(
      (c) => c.name.toLowerCase().includes(term) || String(c.id).includes(term),
    );
  });

  // KPIs reales calculados desde los datos cargados
  readonly totalStockUnits = computed(() =>
    this.products().reduce((acc, p) => acc + (p.stock ?? 0), 0),
  );

  readonly lowStockCount = computed(() =>
    this.products().filter((p) => p.stock <= 5).length,
  );

  ngOnInit(): void {
    this.refreshAll();
  }

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
    this.clearMessages();
    this.confirmDeleteProductId.set(null);
    this.confirmDeleteCategoryId.set(null);
  }

  refreshAll(): void {
    this.isLoadingData.set(true);
    this.loadCategories();
    this.loadProducts();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        if (!this.editingProductId() && !this.productForm.controls.categoryId.value && data.length > 0) {
          this.productForm.controls.categoryId.setValue(data[0].id);
        }
      },
      error: (err) => {
        this.errorMessage.set(
          extractApiErrorMessage(err, 'No se pudieron cargar las categorías desde CatalogService.'),
        );
      },
    });
  }

  loadProducts(): void {
    this.isLoadingData.set(true);
    this.productService.getProducts(this.currentPage(), this.pageSize()).subscribe({
      next: (page) => {
        this.products.set(page.content);
        this.totalElements.set(page.totalElements);
        this.totalPages.set(page.totalPages);
        this.isLoadingData.set(false);
        this.updateTimestamp();
      },
      error: (err) => {
        this.isLoadingData.set(false);
        this.errorMessage.set(
          extractApiErrorMessage(err, 'No se pudieron cargar los productos desde CatalogService.'),
        );
      },
    });
  }

  // =========================================================================
  // CRUD DE CATEGORÍAS (/api/categories)
  // =========================================================================
  isCategoryFieldInvalid(): boolean {
    const ctrl = this.categoryForm.controls.name;
    return ctrl.invalid && (ctrl.dirty || ctrl.touched || this.categorySubmitted());
  }

  onSaveCategory(): void {
    this.categorySubmitted.set(true);
    this.clearMessages();

    if (this.isSavingCategory()) return;

    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const payload: CategoryPayload = {
      name: this.categoryForm.controls.name.value.trim(),
    };

    this.isSavingCategory.set(true);
    const editId = this.editingCategoryId();

    const request$ =
      editId !== null
        ? this.categoryService.updateCategory(editId, payload)
        : this.categoryService.createCategory(payload);

    request$.subscribe({
      next: (saved) => {
        this.isSavingCategory.set(false);
        this.successMessage.set(
          editId !== null
            ? `Categoría "${saved.name}" actualizada correctamente.`
            : `Categoría "${saved.name}" creada correctamente.`,
        );
        this.resetCategoryForm();
        this.loadCategories();
        this.loadProducts();
      },
      error: (err) => {
        this.isSavingCategory.set(false);
        this.errorMessage.set(
          extractApiErrorMessage(err, 'No fue posible guardar la categoría.'),
        );
      },
    });
  }

  startEditCategory(category: Category): void {
    this.clearMessages();
    this.confirmDeleteCategoryId.set(null);
    this.editingCategoryId.set(category.id);
    this.categorySubmitted.set(false);
    this.categoryForm.setValue({ name: category.name });
  }

  resetCategoryForm(): void {
    this.editingCategoryId.set(null);
    this.categorySubmitted.set(false);
    this.categoryForm.reset({ name: '' });
  }

  askDeleteCategory(categoryId: number): void {
    this.confirmDeleteCategoryId.set(categoryId);
  }

  cancelDeleteCategory(): void {
    this.confirmDeleteCategoryId.set(null);
  }

  confirmDeleteCategory(category: Category): void {
    if (this.deletingId() !== null) return;
    this.clearMessages();
    this.deletingId.set(category.id);

    this.categoryService.deleteCategory(category.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmDeleteCategoryId.set(null);
        if (this.editingCategoryId() === category.id) {
          this.resetCategoryForm();
        }
        this.successMessage.set(`Categoría "${category.name}" desactivada (borrado lógico).`);
        this.loadCategories();
        this.loadProducts();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.confirmDeleteCategoryId.set(null);
        this.errorMessage.set(
          extractApiErrorMessage(err, `No se pudo desactivar la categoría "${category.name}".`),
        );
      },
    });
  }

  // =========================================================================
  // CRUD DE PRODUCTOS (/api/products)
  // =========================================================================
  isProductFieldInvalid(fieldName: keyof typeof this.productForm.controls): boolean {
    const ctrl = this.productForm.controls[fieldName];
    return ctrl.invalid && (ctrl.dirty || ctrl.touched || this.productSubmitted());
  }

  onImageUrlInput(): void {
    this.previewError.set(false);
  }

  onPreviewImageError(): void {
    this.previewError.set(true);
  }

  get previewImageUrl(): string {
    const raw = this.productForm.controls.imageUrl.value;
    return raw ? raw.trim() : '';
  }

  onSaveProduct(): void {
    this.productSubmitted.set(true);
    this.clearMessages();

    if (this.isSavingProduct()) return;

    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const raw = this.productForm.getRawValue();
    const payload: ProductPayload = {
      sku: String(raw.sku ?? '').trim(),
      name: String(raw.name ?? '').trim(),
      description: String(raw.description ?? '').trim(),
      price: Number(raw.price),
      stock: Math.floor(Number(raw.stock)),
      imageUrl: String(raw.imageUrl ?? '').trim(),
      categoryId: Number(raw.categoryId),
    };

    this.isSavingProduct.set(true);
    const editId = this.editingProductId();

    const request$ =
      editId !== null
        ? this.productService.updateProduct(editId, payload)
        : this.productService.createProduct(payload);

    request$.subscribe({
      next: (saved) => {
        this.isSavingProduct.set(false);
        this.successMessage.set(
          editId !== null
            ? `Producto "${saved.name}" (${saved.sku}) actualizado correctamente.`
            : `Producto "${saved.name}" (${saved.sku}) registrado en el catálogo.`,
        );
        this.resetProductForm();
        this.loadProducts();
      },
      error: (err) => {
        this.isSavingProduct.set(false);
        this.errorMessage.set(
          extractApiErrorMessage(err, 'No fue posible guardar el producto. Revisa SKU y campos.'),
        );
      },
    });
  }

  startEditProduct(product: Product): void {
    this.clearMessages();
    this.confirmDeleteProductId.set(null);
    this.editingProductId.set(product.id);
    this.productSubmitted.set(false);
    this.previewError.set(false);

    this.productForm.setValue({
      sku: product.sku,
      name: product.name,
      categoryId: product.categoryId,
      price: product.price,
      stock: product.stock,
      imageUrl: product.imageUrl,
      description: product.description ?? '',
    });
  }

  resetProductForm(): void {
    this.editingProductId.set(null);
    this.productSubmitted.set(false);
    this.previewError.set(false);
    const defaultCategoryId = this.categories().length > 0 ? this.categories()[0].id : null;

    this.productForm.reset({
      sku: '',
      name: '',
      categoryId: defaultCategoryId,
      price: null,
      stock: 0,
      imageUrl: '',
      description: '',
    });
  }

  askDeleteProduct(productId: number): void {
    this.confirmDeleteProductId.set(productId);
  }

  cancelDeleteProduct(): void {
    this.confirmDeleteProductId.set(null);
  }

  confirmDeleteProduct(product: Product): void {
    if (this.deletingId() !== null) return;
    this.clearMessages();
    this.deletingId.set(product.id);

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.confirmDeleteProductId.set(null);
        if (this.editingProductId() === product.id) {
          this.resetProductForm();
        }
        this.successMessage.set(`Producto "${product.name}" desactivado (borrado lógico).`);
        if (this.products().length === 1 && this.currentPage() > 0) {
          this.currentPage.update((p) => p - 1);
        }
        this.loadProducts();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.confirmDeleteProductId.set(null);
        this.errorMessage.set(
          extractApiErrorMessage(err, `No se pudo desactivar el producto "${product.name}".`),
        );
      },
    });
  }

  // Paginación de tabla administrativa
  prevPage(): void {
    if (this.currentPage() > 0) {
      this.currentPage.update((p) => p - 1);
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.currentPage() + 1 < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
      this.loadProducts();
    }
  }

  getStockPillClass(stock: number): string {
    if (stock <= 0) return 'edelyx-admin-stock-pill edelyx-admin-stock-zero';
    if (stock <= 5) return 'edelyx-admin-stock-pill edelyx-admin-stock-low';
    return 'edelyx-admin-stock-pill edelyx-admin-stock-ok';
  }

  countProductsInCategory(categoryId: number): number {
    return this.products().filter((p) => p.categoryId === categoryId).length;
  }

  formatAmount(value: number): string {
    return (value ?? 0).toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  clearMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  private updateTimestamp(): void {
    this.lastUpdated.set(
      new Date().toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    );
  }
}
