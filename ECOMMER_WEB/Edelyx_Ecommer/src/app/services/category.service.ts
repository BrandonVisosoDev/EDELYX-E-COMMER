import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environment/environment';
import { Category, CategoryPayload } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/categories`;

  // Señal de versión para sincronizar consumidores tras cambios CRUD en Admin
  readonly categoriesVersion = signal<number>(0);

  // GET /api/categories -> Lista todas las categorías activas
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  // POST /api/categories -> Crea una nueva categoría
  createCategory(payload: CategoryPayload): Observable<Category> {
    return this.http
      .post<Category>(this.apiUrl, payload)
      .pipe(tap(() => this.categoriesVersion.update((v) => v + 1)));
  }

  // PUT /api/categories/{id} -> Actualiza el nombre de una categoría
  updateCategory(id: number, payload: CategoryPayload): Observable<Category> {
    return this.http
      .put<Category>(`${this.apiUrl}/${id}`, payload)
      .pipe(tap(() => this.categoriesVersion.update((v) => v + 1)));
  }

  // DELETE /api/categories/{id} -> Borrado lógico (desactivación)
  deleteCategory(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.categoriesVersion.update((v) => v + 1)));
  }
}
