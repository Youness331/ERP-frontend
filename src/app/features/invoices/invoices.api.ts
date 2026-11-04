import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Paginated } from '../../core/models/api.models';
import { Invoice, PaymentPayload } from '../../core/models/invoices.models';

export interface InvoiceQuery {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  outstanding?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InvoicesApi {
  private readonly http = inject(HttpClient);

  list(query: InvoiceQuery = {}): Observable<Paginated<Invoice>> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('per_page', query.per_page ?? 15);

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.outstanding) {
      params = params.set('outstanding', '1');
    }

    return this.http.get<Paginated<Invoice>>('/invoices', { params });
  }

  send(id: number): Observable<{ data: Invoice }> {
    return this.http.post<{ data: Invoice }>(`/invoices/${id}/send`, {});
  }

  pay(id: number, payload: PaymentPayload): Observable<unknown> {
    return this.http.post(`/invoices/${id}/payments`, payload);
  }

  creditNote(id: number): Observable<{ data: Invoice }> {
    return this.http.post<{ data: Invoice }>(`/invoices/${id}/credit-note`, {});
  }

  pdf(id: number): Observable<Blob> {
    return this.http.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  }
}
