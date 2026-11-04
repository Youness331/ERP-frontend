import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Paginated } from '../../core/models/api.models';
import { Category, Product, ProductPayload } from '../../core/models/catalog.models';

export interface ProductListParams {
  page?: number;
  per_page?: number;
  search?: string;
  category_id?: number | null;
  low_stock?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductsApi {
  private readonly http = inject(HttpClient);

  list(params: ProductListParams = {}): Observable<Paginated<Product>> {
    let httpParams = new HttpParams()
      .set('page', params.page ?? 1)
      .set('per_page', params.per_page ?? 15);

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params.category_id) {
      httpParams = httpParams.set('category_id', params.category_id);
    }

    if (params.low_stock) {
      httpParams = httpParams.set('low_stock', '1');
    }

    return this.http.get<Paginated<Product>>('/products', { params: httpParams });
  }

  create(payload: ProductPayload): Observable<{ data: Product }> {
    return this.http.post<{ data: Product }>('/products', payload);
  }

  update(id: number, payload: ProductPayload): Observable<{ data: Product }> {
    return this.http.patch<{ data: Product }>(`/products/${id}`, payload);
  }

  categories(): Observable<Paginated<Category>> {
    return this.http.get<Paginated<Category>>('/categories', {
      params: new HttpParams().set('per_page', 100),
    });
  }
}
