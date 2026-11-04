import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../core/auth/auth.service';
import { formatMoney, formatNumber } from '../../core/format';
import { toApiError } from '../../core/http/error.interceptor';
import { PaginationMeta } from '../../core/models/api.models';
import { Category, Product } from '../../core/models/catalog.models';
import { ProductsApi } from './products.api';

@Component({
  selector: 'app-products-page',
  imports: [ReactiveFormsModule],
  templateUrl: './products.page.html',
  styleUrl: './products.page.scss',
})
export class ProductsPage implements OnInit {
  private readonly api = inject(ProductsApi);
  private readonly formBuilder = inject(FormBuilder);

  protected readonly auth = inject(AuthService);

  protected readonly products = signal<Product[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly searchTerm = signal('');
  protected readonly categoryId = signal<number | null>(null);
  protected readonly lowStockOnly = signal(false);

  protected readonly panelOpen = signal(false);
  protected readonly editing = signal<Product | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly money = formatMoney;
  protected readonly number = formatNumber;

  protected readonly form = this.formBuilder.nonNullable.group({
    sku: ['', [Validators.required, Validators.maxLength(60)]],
    name: ['', [Validators.required, Validators.maxLength(180)]],
    category_id: [null as number | null],
    unit: ['unité'],
    purchase_price: [0, [Validators.min(0)]],
    sale_price: [0, [Validators.min(0)]],
    tax_rate: [20, [Validators.min(0), Validators.max(100)]],
    reorder_level: [0, [Validators.min(0)]],
    track_stock: [true],
    is_active: [true],
  });

  private currentPage = 1;

  ngOnInit(): void {
    this.api.categories().subscribe({
      next: (response) => this.categories.set(response.data),
      error: () => this.categories.set([]),
    });

    this.load(1);
  }

  protected submitSearch(value: string): void {
    this.searchTerm.set(value.trim());
    this.load(1);
  }

  protected filterByCategory(value: string): void {
    this.categoryId.set(value ? Number(value) : null);
    this.load(1);
  }

  protected toggleLowStock(checked: boolean): void {
    this.lowStockOnly.set(checked);
    this.load(1);
  }

  protected goTo(page: number): void {
    const meta = this.meta();

    if (!meta || page < 1 || page > meta.last_page || page === this.currentPage) {
      return;
    }

    this.load(page);
  }

  protected openCreate(): void {
    this.editing.set(null);
    this.formError.set(null);
    this.form.reset({
      sku: '',
      name: '',
      category_id: null,
      unit: 'unité',
      purchase_price: 0,
      sale_price: 0,
      tax_rate: 20,
      reorder_level: 0,
      track_stock: true,
      is_active: true,
    });
    this.panelOpen.set(true);
  }

  protected openEdit(product: Product): void {
    this.editing.set(product);
    this.formError.set(null);
    this.form.reset({
      sku: product.sku,
      name: product.name,
      category_id: product.category_id,
      unit: product.unit,
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      tax_rate: product.tax_rate,
      reorder_level: product.reorder_level,
      track_stock: product.track_stock,
      is_active: product.is_active,
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

    const editing = this.editing();
    const request = editing
      ? this.api.update(editing.id, this.form.getRawValue())
      : this.api.create(this.form.getRawValue());

    this.saving.set(true);
    this.formError.set(null);

    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.panelOpen.set(false);
        this.load(editing ? this.currentPage : 1);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(toApiError(error).message);
      },
    });
  }

  protected stockLabel(product: Product): string {
    return product.track_stock ? this.number(product.stock_quantity ?? 0) : 'Non suivi';
  }

  private load(page: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.api
      .list({
        page,
        per_page: 15,
        search: this.searchTerm(),
        category_id: this.categoryId(),
        low_stock: this.lowStockOnly(),
      })
      .subscribe({
        next: (response) => {
          this.currentPage = page;
          this.products.set(response.data);
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
