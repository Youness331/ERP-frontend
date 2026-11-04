import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Paginated } from '../../core/models/api.models';
import { Product, Warehouse } from '../../core/models/catalog.models';
import { StockLevel, StockMovement, StockMovementPayload, StockMovementType } from '../../core/models/stock.models';

export interface StockQuery {
  page?: number;
  per_page?: number;
  search?: string;
  warehouse_id?: number | null;
}

@Injectable({ providedIn: 'root' })
export class StockApi {
  private readonly http = inject(HttpClient);

  levels(query: StockQuery = {}): Observable<Paginated<StockLevel>> {
    return this.http.get<Paginated<StockLevel>>('/stock', { params: this.params(query) });
  }

  movements(query: StockQuery & { type?: StockMovementType | '' } = {}): Observable<Paginated<StockMovement>> {
    let params = this.params(query);

    if (query.type) {
      params = params.set('type', query.type);
    }

    return this.http.get<Paginated<StockMovement>>('/stock/movements', { params });
  }

  create(payload: StockMovementPayload): Observable<{ data: StockMovement }> {
    return this.http.post<{ data: StockMovement }>('/stock/movements', payload);
  }

  warehouses(): Observable<Paginated<Warehouse>> {
    return this.http.get<Paginated<Warehouse>>('/warehouses', {
      params: new HttpParams().set('per_page', 100),
    });
  }

  products(search = ''): Observable<Paginated<Product>> {
    let params = new HttpParams().set('per_page', 100);

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<Paginated<Product>>('/products', { params });
  }

  private params(query: StockQuery): HttpParams {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('per_page', query.per_page ?? 15);

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.warehouse_id) {
      params = params.set('warehouse_id', query.warehouse_id);
    }

    return params;
  }
}
