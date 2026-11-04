import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { formatMoney, formatNumber } from '../../core/format';
import { toApiError } from '../../core/http/error.interceptor';
import {
  PurchasesReport,
  ReceivablesAging,
  SalesReport,
  StockValuation,
} from '../../core/models/reports.models';
import { ReportsApi } from './reports.api';

type Tab = 'sales' | 'purchases' | 'stock' | 'aging';

@Component({
  selector: 'app-reports-page',
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.scss',
})
export class ReportsPage implements OnInit {
  private readonly api = inject(ReportsApi);

  protected readonly tab = signal<Tab>('sales');
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly sales = signal<SalesReport | null>(null);
  protected readonly purchases = signal<PurchasesReport | null>(null);
  protected readonly stock = signal<StockValuation | null>(null);
  protected readonly aging = signal<ReceivablesAging | null>(null);

  protected readonly money = formatMoney;
  protected readonly number = formatNumber;

  protected readonly from = signal(this.monthStart());
  protected readonly to = signal(this.monthEnd());

  protected readonly maxMonthly = computed(() => {
    const series = this.sales()?.by_month ?? [];

    return Math.max(1, ...series.map((point) => point.total));
  });

  ngOnInit(): void {
    this.load();
  }

  protected selectTab(tab: Tab): void {
    if (this.tab() === tab) {
      return;
    }

    this.tab.set(tab);
    this.load();
  }

  protected updateFrom(value: string): void {
    this.from.set(value);
  }

  protected updateTo(value: string): void {
    this.to.set(value);
  }

  protected refresh(): void {
    this.load();
  }

  protected barHeight(total: number): string {
    return `${Math.max(3, Math.round((total / this.maxMonthly()) * 100))}%`;
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);

    const onError = (error: unknown): void => {
      this.error.set(toApiError(error).message);
      this.loading.set(false);
    };

    const onDone = (): void => this.loading.set(false);

    switch (this.tab()) {
      case 'sales':
        this.api.sales(this.from(), this.to()).subscribe({
          next: (report) => {
            this.sales.set(report);
            onDone();
          },
          error: onError,
        });

        return;

      case 'purchases':
        this.api.purchases(this.from(), this.to()).subscribe({
          next: (report) => {
            this.purchases.set(report);
            onDone();
          },
          error: onError,
        });

        return;

      case 'stock':
        this.api.stockValuation().subscribe({
          next: (report) => {
            this.stock.set(report);
            onDone();
          },
          error: onError,
        });

        return;

      case 'aging':
        this.api.receivablesAging().subscribe({
          next: (report) => {
            this.aging.set(report);
            onDone();
          },
          error: onError,
        });
    }
  }

  private monthStart(): string {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  }

  private monthEnd(): string {
    const now = new Date();
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
  }
}
