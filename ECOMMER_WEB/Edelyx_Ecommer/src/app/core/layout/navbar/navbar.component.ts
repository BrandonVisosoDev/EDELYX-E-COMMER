import { Component, effect, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';
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
  readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly counterRef = viewChild<ElementRef<HTMLElement>>('cartCounter');

  // Estados Reactivos con Signals
  categories = signal<Category[]>([]);
  selectedCategoryId = signal<string>('');
  searchQuery = signal<string>('');

  // Contador reactivo compartido con el catálogo y drawer
  totalItems = this.cartService.totalItems;
  cartCount = this.cartService.totalItems;

  private initializedCounter = false;
  private initializedCategories = false;

  constructor() {
    effect(() => {
      const version = this.categoryService.categoriesVersion();
      if (!this.initializedCategories) {
        this.initializedCategories = true;
        return;
      }
      if (version > 0) {
        this.reloadCategories();
      }
    });

    effect(() => {
      const count = this.totalItems();
      const badge = this.counterRef()?.nativeElement;
      if (!this.initializedCounter) {
        this.initializedCounter = true;
        return;
      }
      if (
        badge &&
        count >= 0 &&
        typeof window !== 'undefined' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        gsap.fromTo(
          badge,
          { scale: 1.32 },
          {
            scale: 1,
            duration: 0.28,
            ease: 'back.out(2.4)',
            overwrite: 'auto',
            clearProps: 'transform',
          },
        );
      }
    });
  }

  ngOnInit(): void {
    this.reloadCategories();

    this.route.queryParams.subscribe((params) => {
      this.selectedCategoryId.set(params['category'] ? String(params['category']) : '');
      this.searchQuery.set(params['q'] ? String(params['q']) : '');
    });
  }

  private reloadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Error al cargar categorías en Navbar:', err),
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
