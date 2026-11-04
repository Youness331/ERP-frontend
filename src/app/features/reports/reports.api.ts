import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { ApiEnvelope } from '../../core/models/api.models';
import {
  PurchasesReport,
  ReceivablesAging,
  SalesReport,
  StockValuation,
} from '../../core/models/reports.models';

@Injectable({ providedIn: 'root' })
export class ReportsApi {
  private readonly http = inject(HttpClient);

  sales(from: string, to: string): Observable<SalesReport> {
    return this.http
      .get<ApiEnvelope<SalesReport>>('/reports/sales', { params: this.period(from, to) })
      .pipe(map((response) => response.data));
  }

  purchases(from: string, to: string): Observable<PurchasesReport> {
    return this.http
      .get<ApiEnvelope<PurchasesReport>>('/reports/purchases', { params: this.period(from, to) })
      .pipe(map((response) => response.data));
  }

  stockValuation(): Observable<StockValuation> {
    return this.http
      .get<ApiEnvelope<StockValuation>>('/reports/stock-valuation')
      .pipe(map((response) => response.data));
  }

  receivablesAging(): Observable<ReceivablesAging> {
    return this.http
      .get<ApiEnvelope<ReceivablesAging>>('/reports/receivables-aging')
      .pipe(map((response) => response.data));
  }

  private period(from: string, to: string): HttpParams {
    return new HttpParams().set('from', from).set('to', to);
  }
}
