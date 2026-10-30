import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { CategoryService } from '../../../services/category.service';
import { Category } from '../../../models/category.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.component.html',
})
export class NavbarComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  // Estados Reactivos
  categories = signal<Category[]>([]);
  selectedCategoryId = signal<string>('');
  searchQuery = signal<string>('');

  // Contador del carrito (por ahora en 0, mañana lo conectamos a Signals)
  cartCount = signal<number>(0);

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Error al cargar categorías en Navbar:', err),
    });
  }

  onFilterChange(): void {
    const categoryId = this.selectedCategoryId() ? Number(this.selectedCategoryId()) : null;
    this.router.navigate([], {
      queryParams: {
        category: categoryId,
        q: this.searchQuery() || null,
      },
      queryParamsHandling: 'merge',
    });
  }
}
