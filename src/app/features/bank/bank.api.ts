import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Paginated } from '../../core/models/api.models';
import {
  BankLine,
  BankLinePayload,
  BankSummary,
  Payment,
} from '../../core/models/payments.models';

export interface BankQuery {
  page?: number;
  per_page?: number;
  status?: string;
  direction?: string;
}

@Injectable({ providedIn: 'root' })
export class BankApi {
  private readonly http = inject(HttpClient);

  list(query: BankQuery = {}): Observable<Paginated<BankLine>> {
    let params = new HttpParams()
      .set('page', query.page ?? 1)
      .set('per_page', query.per_page ?? 15);

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.direction) {
      params = params.set('direction', query.direction);
    }

    return this.http.get<Paginated<BankLine>>('/bank-lines', { params });
  }

  summary(): Observable<{ data: BankSummary }> {
    return this.http.get<{ data: BankSummary }>('/bank-lines/summary');
  }

  create(payload: BankLinePayload): Observable<{ data: BankLine }> {
    return this.http.post<{ data: BankLine }>('/bank-lines', payload);
  }

  match(lineId: number, paymentId: number): Observable<{ data: BankLine }> {
    return this.http.post<{ data: BankLine }>(`/bank-lines/${lineId}/match`, {
      payment_id: paymentId,
    });
  }

  unmatch(lineId: number): Observable<{ data: BankLine }> {
    return this.http.post<{ data: BankLine }>(`/bank-lines/${lineId}/unmatch`, {});
  }

  suggestions(lineId: number): Observable<Paginated<Payment>> {
    return this.http.get<Paginated<Payment>>(`/bank-lines/${lineId}/suggestions`);
  }
}
