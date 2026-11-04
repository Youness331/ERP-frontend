import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Paginated } from '../../core/models/api.models';
import { Client } from '../../core/models/api.models';
import { Product, Supplier, Warehouse } from '../../core/models/catalog.models';
import {
  PurchaseOrder,
  PurchaseOrderPayload,
  SalesOrder,
  SalesOrderPayload,
} from '../../core/models/orders.models';

export interface OrderQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);

  sales(query: OrderQuery = {}): Observable<Paginated<SalesOrder>> {
    return this.http.get<Paginated<SalesOrder>>('/sales-orders', { params: this.params(query) });
  }

  createSale(payload: SalesOrderPayload): Observable<{ data: SalesOrder }> {
    return this.http.post<{ data: SalesOrder }>('/sales-orders', payload);
  }

  confirmSale(id: number): Observable<unknown> {
    return this.http.post(`/sales-orders/${id}/confirm`, {});
  }

  deliverSale(id: number): Observable<unknown> {
    return this.http.post(`/sales-orders/${id}/deliver`, {});
  }

  purchases(query: OrderQuery = {}): Observable<Paginated<PurchaseOrder>> {
    return this.http.get<Paginated<PurchaseOrder>>('/purchase-orders', { params: this.params(query) });
  }

  createPurchase(payload: PurchaseOrderPayload): Observable<{ data: PurchaseOrder }> {
    return this.http.post<{ data: PurchaseOrder }>('/purchase-orders', payload);
  }

  confirmPurchase(id: number): Observable<unknown> {
    return this.http.post(`/purchase-orders/${id}/confirm`, {});
  }

  receivePurchase(id: number): Observable<unknown> {
    return this.http.post(`/purchase-orders/${id}/receive`, {});
  }

  clients(): Observable<Paginated<Client>> {
    return this.http.get<Paginated<Client>>('/clients', {
      params: new HttpParams().set('per_page', 100),
    });
  }

  suppliers(): Observable<Paginated<Supplier>> {
    return this.http.get<Paginated<Supplier>>('/suppliers', {
      params: new HttpParams().set('per_page', 100),
    });
  }

  warehouses(): Observable<Paginated<Warehouse>> {
    return this.http.get<Paginated<Warehouse>>('/warehouses', {
      params: new HttpParams().set('per_page', 100),
    });
  }

  products(): Observable<Paginated<Product>> {
    return this.http.get<Paginated<Product>>('/products', {
      params: new HttpParams().set('per_page', 100),
    });
  }

  private params(query: OrderQuery): HttpParams {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('per_page', query.per_page ?? 15);

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    return params;
  }
}
