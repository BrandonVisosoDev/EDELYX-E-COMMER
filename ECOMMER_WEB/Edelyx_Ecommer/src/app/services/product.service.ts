import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Product, ProductPayload } from '../models/product.model';
import { PageResponse } from '../models/page.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  // GET /api/products?page=0&size=10 -> Obtiene productos activos paginados
  getProducts(
    page: number = 0,
    size: number = 10,
    categoryId?: number,
  ): Observable<PageResponse<Product>> {
    let params = new HttpParams().set('page', page.toString()).set('size', size.toString());

    if (categoryId) {
      params = params.set('categoryId', categoryId.toString());
    }

    return this.http.get<PageResponse<Product>>(this.apiUrl, { params });
  }

  // GET /api/products/{id} -> Obtiene detalle de un producto por ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  // POST /api/products -> Registra un nuevo producto
  createProduct(payload: ProductPayload): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, payload);
  }

  // PUT /api/products/{id} -> Actualiza un producto existente
  updateProduct(id: number, payload: ProductPayload): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, payload);
  }

  // DELETE /api/products/{id} -> Borrado lógico (desactivación)
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
