import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { formatDate, formatMoney, formatNumber, formatPercent } from '../../core/format';
import { toApiError } from '../../core/http/error.interceptor';
import { DashboardSummary } from '../../core/models/api.models';
import { DashboardApi } from './dashboard.api';

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage implements OnInit {
  private readonly api = inject(DashboardApi);

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly money = formatMoney;
  protected readonly number = formatNumber;
  protected readonly percent = formatPercent;
  protected readonly date = formatDate;

  protected readonly currency = computed(() => this.summary()?.currency.symbol ?? 'DH');

  protected readonly maxMonthlyTotal = computed(() => {
    const series = this.summary()?.charts.sales_last_12_months ?? [];

    return Math.max(1, ...series.map((point) => point.total));
  });

  ngOnInit(): void {
    this.reload();
  }

  protected reload(): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.load().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.error.set(toApiError(error).message);
        this.loading.set(false);
      },
    });
  }

  protected barHeight(total: number): string {
    return `${Math.max(4, Math.round((total / this.maxMonthlyTotal()) * 100))}%`;
  }
}
