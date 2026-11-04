import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { formatDate, formatMoney } from '../../core/format';
import { toApiError } from '../../core/http/error.interceptor';
import { PaginationMeta } from '../../core/models/api.models';
import {
  BankLine,
  BankSummary,
  Payment,
  PaymentDirection,
} from '../../core/models/payments.models';
import { BankApi } from './bank.api';

@Component({
  selector: 'app-bank-page',
  imports: [ReactiveFormsModule],
  templateUrl: './bank.page.html',
  styleUrl: './bank.page.scss',
})
export class BankPage implements OnInit {
  private readonly api = inject(BankApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly auth = inject(AuthService);

  protected readonly lines = signal<BankLine[]>([]);
  protected readonly summary = signal<BankSummary | null>(null);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly statusFilter = signal('');
  protected readonly directionFilter = signal('');
  protected readonly busyId = signal<number | null>(null);

  protected readonly createOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly matchOpen = signal(false);
  protected readonly matching = signal<BankLine | null>(null);
  protected readonly suggestions = signal<Payment[]>([]);
  protected readonly suggestionsLoading = signal(false);

  protected readonly money = formatMoney;
  protected readonly date = formatDate;

  protected readonly form = this.formBuilder.nonNullable.group({
    label: ['', [Validators.required, Validators.maxLength(255)]],
    amount: [0, [Validators.required, Validators.min(0.01)]],
    direction: ['in' as PaymentDirection, [Validators.required]],
    value_date: [new Date().toISOString().slice(0, 10)],
    reference: [''],
  });

  private currentPage = 1;

  ngOnInit(): void {
    this.loadSummary();
    this.load(1);
  }

  protected filterByStatus(value: string): void {
    this.statusFilter.set(value);
    this.load(1);
  }

  protected filterByDirection(value: string): void {
    this.directionFilter.set(value);
    this.load(1);
  }

  protected goTo(page: number): void {
    const meta = this.meta();

    if (!meta || page < 1 || page > meta.last_page || page === this.currentPage) {
      return;
    }

    this.load(page);
  }

  protected canReconcile(): boolean {
    return this.auth.can('bank.reconcile');
  }

  protected openCreate(): void {
    this.formError.set(null);
    this.form.reset({
      label: '',
      amount: 0,
      direction: 'in',
      value_date: new Date().toISOString().slice(0, 10),
      reference: '',
    });
    this.createOpen.set(true);
  }

  protected closeCreate(): void {
    this.createOpen.set(false);
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const raw = this.form.getRawValue();

    this.saving.set(true);
    this.formError.set(null);

    this.api
      .create({
        label: raw.label,
        amount: raw.amount,
        direction: raw.direction,
        value_date: raw.value_date,
        reference: raw.reference || null,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.createOpen.set(false);
          this.loadSummary();
          this.load(1);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.formError.set(toApiError(error).message);
        },
      });
  }

  protected openMatch(line: BankLine): void {
    this.matching.set(line);
    this.suggestions.set([]);
    this.suggestionsLoading.set(true);
    this.matchOpen.set(true);

    this.api.suggestions(line.id).subscribe({
      next: (response) => {
        this.suggestions.set(response.data);
        this.suggestionsLoading.set(false);
      },
      error: (error: unknown) => {
        this.suggestionsLoading.set(false);
        this.error.set(toApiError(error).message);
      },
    });
  }

  protected closeMatch(): void {
    this.matchOpen.set(false);
    this.matching.set(null);
  }

  protected match(payment: Payment): void {
    const line = this.matching();

    if (!line) {
      return;
    }

    this.busyId.set(line.id);

    this.api.match(line.id, payment.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.closeMatch();
        this.loadSummary();
        this.load(this.currentPage);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.error.set(toApiError(error).message);
      },
    });
  }

  protected unmatch(line: BankLine): void {
    this.busyId.set(line.id);

    this.api.unmatch(line.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.loadSummary();
        this.load(this.currentPage);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.error.set(toApiError(error).message);
      },
    });
  }

  private loadSummary(): void {
    this.api.summary().subscribe({
      next: (response) => this.summary.set(response.data),
      error: () => undefined,
    });
  }

  private load(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .list({
        page,
        per_page: 15,
        status: this.statusFilter(),
        direction: this.directionFilter(),
      })
      .subscribe({
        next: (response) => {
          this.currentPage = page;
          this.lines.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(toApiError(error).message);
          this.loading.set(false);
        },
      });
  }
}
