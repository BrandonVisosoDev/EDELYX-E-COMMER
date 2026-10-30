import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { Product } from '../models/product.model';
import { PageResponse } from '../models/page.model';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/products`;

  // Obtiene los productos paginados del backend
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

  // Obtiene el detalle de un solo producto por ID
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }
}
