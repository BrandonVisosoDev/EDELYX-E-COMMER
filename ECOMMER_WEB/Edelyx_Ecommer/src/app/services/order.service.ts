import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environment/environment';
import { CreateOrderPayload, Order } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/orders`;

  // POST /api/orders -> Crea una orden validando precios y stock en backend
  createOrder(payload: CreateOrderPayload): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, payload);
  }

  // GET /api/orders/{orderNumber} -> Consulta recibo digital por folio
  getOrderByNumber(orderNumber: string): Observable<Order> {
    const cleanFolio = encodeURIComponent(orderNumber.trim());
    return this.http.get<Order>(`${this.apiUrl}/${cleanFolio}`);
  }

  // PATCH /api/orders/{orderNumber}/cancel -> Cancela orden y reintegra stock vía RabbitMQ
  cancelOrder(orderNumber: string): Observable<Order> {
    const cleanFolio = encodeURIComponent(orderNumber.trim());
    return this.http.patch<Order>(`${this.apiUrl}/${cleanFolio}/cancel`, {});
  }
}
