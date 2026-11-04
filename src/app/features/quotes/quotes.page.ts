import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { ReferenceApi } from '../../core/api/reference.api';
import { AuthService } from '../../core/auth/auth.service';
import { formatDate, formatMoney } from '../../core/format';
import { toApiError } from '../../core/http/error.interceptor';
import { Client, PaginationMeta } from '../../core/models/api.models';
import { Product, Warehouse } from '../../core/models/catalog.models';
import { OrderLinePayload } from '../../core/models/orders.models';
import { Quote } from '../../core/models/quotes.models';
import { computeTotals, OrderLineDraft } from '../../core/order-totals';
import { QuotesApi } from './quotes.api';

@Component({
  selector: 'app-quotes-page',
  templateUrl: './quotes.page.html',
  styleUrl: './quotes.page.scss',
})
export class QuotesPage implements OnInit {
  private readonly api = inject(QuotesApi);
  private readonly reference = inject(ReferenceApi);

  protected readonly auth = inject(AuthService);

  protected readonly quotes = signal<Quote[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly statusFilter = signal('');
  protected readonly busyId = signal<number | null>(null);

  protected readonly clients = signal<Client[]>([]);
  protected readonly warehouses = signal<Warehouse[]>([]);
  protected readonly products = signal<Product[]>([]);

  protected readonly panelOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly clientId = signal<number | null>(null);
  protected readonly warehouseId = signal<number | null>(null);
  protected readonly validUntil = signal('');
  protected readonly draftLines = signal<OrderLineDraft[]>([]);

  protected readonly money = formatMoney;
  protected readonly date = formatDate;

  protected readonly totals = computed(() => computeTotals(this.draftLines()));

  private currentPage = 1;

  ngOnInit(): void {
    this.reference.clients().subscribe({ next: (r) => this.clients.set(r.data), error: () => undefined });
    this.reference.warehouses().subscribe({ next: (r) => this.warehouses.set(r.data), error: () => undefined });
    this.reference.products().subscribe({ next: (r) => this.products.set(r.data), error: () => undefined });

    this.load(1);
  }

  protected filterByStatus(value: string): void {
    this.statusFilter.set(value);
    this.load(1);
  }

  protected goTo(page: number): void {
    const meta = this.meta();

    if (!meta || page < 1 || page > meta.last_page || page === this.currentPage) {
      return;
    }

    this.load(page);
  }

  protected send(quote: Quote): void {
    this.run(this.api.send(quote.id), quote.id);
  }

  protected accept(quote: Quote): void {
    this.run(this.api.accept(quote.id), quote.id);
  }

  protected reject(quote: Quote): void {
    this.run(this.api.reject(quote.id), quote.id);
  }

  protected convert(quote: Quote): void {
    this.run(this.api.convert(quote.id), quote.id);
  }

  protected canSend(quote: Quote): boolean {
    return quote.status === 'draft' && this.auth.can('quotes.send');
  }

  protected canDecide(quote: Quote): boolean {
    return ['sent', 'expired'].includes(quote.status) && this.auth.can('quotes.update');
  }

  protected canConvert(quote: Quote): boolean {
    return quote.can_be_converted && this.auth.can('quotes.convert');
  }

  protected openPanel(): void {
    this.formError.set(null);
    this.clientId.set(null);
    this.warehouseId.set(this.warehouses().find((w) => w.is_default)?.id ?? this.warehouses()[0]?.id ?? null);
    this.validUntil.set('');
    this.draftLines.set([]);
    this.panelOpen.set(true);
  }

  protected closePanel(): void {
    this.panelOpen.set(false);
  }

  protected addLine(): void {
    const product = this.products()[0];

    this.draftLines.update((lines) => [
      ...lines,
      {
        product_id: product?.id ?? null,
        quantity: 1,
        unit_price: product?.sale_price ?? 0,
        tax_rate: product?.tax_rate ?? 20,
      },
    ]);
  }

  protected removeLine(index: number): void {
    this.draftLines.update((lines) => lines.filter((_, position) => position !== index));
  }

  protected selectProduct(index: number, productId: string): void {
    const product = this.products().find((item) => item.id === Number(productId));

    this.draftLines.update((lines) =>
      lines.map((line, position) =>
        position === index
          ? {
              ...line,
              product_id: productId ? Number(productId) : null,
              unit_price: product?.sale_price ?? 0,
              tax_rate: product?.tax_rate ?? 20,
            }
          : line,
      ),
    );
  }

  protected updateLine(index: number, field: 'quantity' | 'unit_price', value: string): void {
    const numeric = Number(value);

    this.draftLines.update((lines) =>
      lines.map((line, position) =>
        position === index ? { ...line, [field]: Number.isFinite(numeric) ? numeric : 0 } : line,
      ),
    );
  }

  protected save(): void {
    const client = this.clientId();
    const warehouse = this.warehouseId();
    const lines = this.draftLines();

    if (client === null || warehouse === null) {
      this.formError.set('Sélectionnez un client et un entrepôt.');

      return;
    }

    if (lines.length === 0 || lines.some((line) => line.product_id === null || line.quantity <= 0)) {
      this.formError.set('Ajoutez au moins une ligne avec un produit et une quantité.');

      return;
    }

    this.saving.set(true);
    this.formError.set(null);

    this.api
      .create({
        client_id: client,
        warehouse_id: warehouse,
        valid_until: this.validUntil() || null,
        lines: lines.map<OrderLinePayload>((line) => ({
          product_id: line.product_id as number,
          quantity: line.quantity,
          unit_price: line.unit_price,
          tax_rate: line.tax_rate,
        })),
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.panelOpen.set(false);
          this.load(1);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.formError.set(toApiError(error).message);
        },
      });
  }

  private run(request: Observable<unknown>, id: number): void {
    this.busyId.set(id);

    request.subscribe({
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

  private load(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api.list({ page, per_page: 15, status: this.statusFilter() }).subscribe({
      next: (response) => {
        this.currentPage = page;
        this.quotes.set(response.data);
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
