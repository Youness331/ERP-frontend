import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Paginated } from '../../core/models/api.models';
import { Quote, QuotePayload } from '../../core/models/quotes.models';
import { SalesOrder } from '../../core/models/orders.models';

export interface QuoteQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
}

@Injectable({ providedIn: 'root' })
export class QuotesApi {
  private readonly http = inject(HttpClient);

  list(query: QuoteQuery = {}): Observable<Paginated<Quote>> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('per_page', query.per_page ?? 15);

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    return this.http.get<Paginated<Quote>>('/quotes', { params });
  }

  create(payload: QuotePayload): Observable<{ data: Quote }> {
    return this.http.post<{ data: Quote }>('/quotes', payload);
  }

  send(id: number): Observable<{ data: Quote }> {
    return this.http.post<{ data: Quote }>(`/quotes/${id}/send`, {});
  }

  accept(id: number): Observable<{ data: Quote }> {
    return this.http.post<{ data: Quote }>(`/quotes/${id}/accept`, {});
  }

  reject(id: number): Observable<{ data: Quote }> {
    return this.http.post<{ data: Quote }>(`/quotes/${id}/reject`, {});
  }

  convert(id: number): Observable<{ data: SalesOrder }> {
    return this.http.post<{ data: SalesOrder }>(`/quotes/${id}/convert`, {});
  }
}
