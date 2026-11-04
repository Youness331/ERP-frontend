import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { formatDate, formatMoney } from '../../core/format';
import { toApiError } from '../../core/http/error.interceptor';
import { PaginationMeta } from '../../core/models/api.models';
import {
  Invoice,
  PAYMENT_METHODS,
  PaymentMethod,
  PaymentPayload,
} from '../../core/models/invoices.models';
import { InvoicesApi } from './invoices.api';

@Component({
  selector: 'app-invoices-page',
  imports: [ReactiveFormsModule],
  templateUrl: './invoices.page.html',
  styleUrl: './invoices.page.scss',
})
export class InvoicesPage implements OnInit {
  private readonly api = inject(InvoicesApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly auth = inject(AuthService);

  protected readonly invoices = signal<Invoice[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly statusFilter = signal('');
  protected readonly outstandingOnly = signal(false);
  protected readonly busyId = signal<number | null>(null);

  protected readonly panelOpen = signal(false);
  protected readonly target = signal<Invoice | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly methods = PAYMENT_METHODS;
  protected readonly money = formatMoney;
  protected readonly date = formatDate;

  protected readonly form = this.formBuilder.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(0.01)]],
    method: ['bank_transfer' as PaymentMethod, [Validators.required]],
    payment_date: [new Date().toISOString().slice(0, 10), [Validators.required]],
    reference_number: [''],
  });

  private currentPage = 1;

  ngOnInit(): void {
    this.load(1);
  }

  protected filterByStatus(value: string): void {
    this.statusFilter.set(value);
    this.load(1);
  }

  protected toggleOutstanding(checked: boolean): void {
    this.outstandingOnly.set(checked);
    this.load(1);
  }

  protected goTo(page: number): void {
    const meta = this.meta();

    if (!meta || page < 1 || page > meta.last_page || page === this.currentPage) {
      return;
    }

    this.load(page);
  }

  protected canSend(invoice: Invoice): boolean {
    return invoice.status === 'draft' && this.auth.can('invoices.send');
  }

  protected canPay(invoice: Invoice): boolean {
    return invoice.balance_due > 0
      && ['sent', 'partially_paid', 'overdue'].includes(invoice.status)
      && this.auth.can('payments.create');
  }

  protected canCredit(invoice: Invoice): boolean {
    return invoice.type === 'invoice'
      && invoice.balance_due > 0
      && !['draft', 'cancelled'].includes(invoice.status)
      && this.auth.can('invoices.create');
  }

  protected send(invoice: Invoice): void {
    this.busyId.set(invoice.id);

    this.api.send(invoice.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load(this.currentPage);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.error.set(toApiError(error).message);
      },
    });
  }

  protected download(invoice: Invoice): void {
    this.api.pdf(invoice.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');

        anchor.href = url;
        anchor.download = `${invoice.reference}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      error: (error: unknown) => this.error.set(toApiError(error).message),
    });
  }

  protected credit(invoice: Invoice): void {
    const confirmed =
      typeof window === 'undefined'
        ? true
        : window.confirm(`Émettre un avoir de ${this.money(invoice.balance_due)} sur ${invoice.reference} ?`);

    if (!confirmed) {
      return;
    }

    this.busyId.set(invoice.id);

    this.api.creditNote(invoice.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load(this.currentPage);
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.error.set(toApiError(error).message);
      },
    });
  }

  protected openPayment(invoice: Invoice): void {
    this.target.set(invoice);
    this.formError.set(null);
    this.form.reset({
      amount: invoice.balance_due,
      method: 'bank_transfer',
      payment_date: new Date().toISOString().slice(0, 10),
      reference_number: '',
    });
    this.panelOpen.set(true);
  }

  protected closePanel(): void {
    this.panelOpen.set(false);
    this.target.set(null);
  }

  protected savePayment(): void {
    const invoice = this.target();

    if (!invoice || this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    const raw = this.form.getRawValue();
    const payload: PaymentPayload = {
      amount: raw.amount,
      method: raw.method,
      payment_date: raw.payment_date,
      reference_number: raw.reference_number || null,
    };

    this.saving.set(true);
    this.formError.set(null);

    this.api.pay(invoice.id, payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.panelOpen.set(false);
        this.target.set(null);
        this.load(this.currentPage);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(toApiError(error).message);
      },
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
        outstanding: this.outstandingOnly(),
      })
      .subscribe({
        next: (response) => {
          this.currentPage = page;
          this.invoices.set(response.data);
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
