import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { formatDate, formatMoney, formatNumber } from '../../core/format';
import { toApiError } from '../../core/http/error.interceptor';
import { PaginationMeta } from '../../core/models/api.models';
import { Product, Warehouse } from '../../core/models/catalog.models';
import { StockLevel, StockMovement, StockMovementType } from '../../core/models/stock.models';
import { StockApi } from './stock.api';

type Tab = 'levels' | 'movements';

@Component({
  selector: 'app-stock-page',
  imports: [ReactiveFormsModule],
  templateUrl: './stock.page.html',
  styleUrl: './stock.page.scss',
})
export class StockPage implements OnInit {
  private readonly api = inject(StockApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly auth = inject(AuthService);

  protected readonly tab = signal<Tab>('levels');
  protected readonly levels = signal<StockLevel[]>([]);
  protected readonly movements = signal<StockMovement[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly warehouses = signal<Warehouse[]>([]);
  protected readonly products = signal<Product[]>([]);

  protected readonly warehouseId = signal<number | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly movementType = signal<StockMovementType | ''>('');

  protected readonly panelOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly money = formatMoney;
  protected readonly number = formatNumber;
  protected readonly date = formatDate;

  protected readonly form = this.formBuilder.nonNullable.group({
    product_id: [null as number | null, [Validators.required]],
    warehouse_id: [null as number | null, [Validators.required]],
    type: ['in' as StockMovementType, [Validators.required]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    unit_cost: [null as number | null],
    reason: [''],
  });

  private currentPage = 1;

  ngOnInit(): void {
    this.api.warehouses().subscribe({
      next: (response) => this.warehouses.set(response.data),
      error: () => this.warehouses.set([]),
    });

    this.api.products().subscribe({
      next: (response) => this.products.set(response.data),
      error: () => this.products.set([]),
    });

    this.load(1);
  }

  protected selectTab(tab: Tab): void {
    if (this.tab() === tab) {
      return;
    }

    this.tab.set(tab);
    this.load(1);
  }

  protected submitSearch(value: string): void {
    this.searchTerm.set(value.trim());
    this.load(1);
  }

  protected filterByWarehouse(value: string): void {
    this.warehouseId.set(value ? Number(value) : null);
    this.load(1);
  }

  protected filterByType(value: string): void {
    this.movementType.set(value as StockMovementType | '');
    this.load(1);
  }

  protected goTo(page: number): void {
    const meta = this.meta();

    if (!meta || page < 1 || page > meta.last_page || page === this.currentPage) {
      return;
    }

    this.load(page);
  }

  protected openPanel(): void {
    this.formError.set(null);
    this.form.reset({
      product_id: null,
      warehouse_id: this.warehouseId() ?? this.warehouses()[0]?.id ?? null,
      type: 'in',
      quantity: 1,
      unit_cost: null,
      reason: '',
    });
    this.panelOpen.set(true);
  }

  protected closePanel(): void {
    this.panelOpen.set(false);
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
        product_id: raw.product_id as number,
        warehouse_id: raw.warehouse_id as number,
        type: raw.type,
        quantity: raw.quantity,
        unit_cost: raw.unit_cost,
        reason: raw.reason || null,
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

  protected isAdjustment(): boolean {
    return this.form.controls.type.value === 'adjustment';
  }

  private load(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    const onError = (error: unknown): void => {
      this.error.set(toApiError(error).message);
      this.loading.set(false);
    };

    const query = {
      page,
      per_page: 15,
      search: this.searchTerm(),
      warehouse_id: this.warehouseId(),
    };

    if (this.tab() === 'levels') {
      this.api.levels(query).subscribe({
        next: (response) => {
          this.currentPage = page;
          this.levels.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: onError,
      });

      return;
    }

    this.api.movements({ ...query, type: this.movementType() }).subscribe({
      next: (response) => {
        this.currentPage = page;
        this.movements.set(response.data);
        this.meta.set(response.meta);
        this.loading.set(false);
      },
      error: onError,
    });
  }
}
