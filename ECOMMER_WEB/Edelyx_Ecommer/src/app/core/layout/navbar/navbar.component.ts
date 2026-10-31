import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../services/category.service';
import { CartService } from '../../../services/cart.service';
import { Category } from '../../../models/category.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Estados Reactivos con Signals
  categories = signal<Category[]>([]);
  selectedCategoryId = signal<string>('');
  searchQuery = signal<string>('');

  // Contador reactivo compartido con el catálogo
  cartCount = this.cartService.cartCount;

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Error al cargar categorías en Navbar:', err),
    });

    this.route.queryParams.subscribe((params) => {
      this.selectedCategoryId.set(params['category'] ? String(params['category']) : '');
      this.searchQuery.set(params['q'] ? String(params['q']) : '');
    });
  }

  onFilterChange(): void {
    const categoryId = this.selectedCategoryId() ? Number(this.selectedCategoryId()) : null;
    this.router.navigate(['/'], {
      queryParams: {
        category: categoryId,
        q: this.searchQuery().trim() || null,
      },
      queryParamsHandling: 'merge',
    });
  }
}
