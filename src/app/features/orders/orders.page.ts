import { Component, computed, inject, OnInit, signal } from '@angular/core';

import { AuthService } from '../../core/auth/auth.service';
import { formatDate, formatMoney } from '../../core/format';
import { toApiError } from '../../core/http/error.interceptor';
import { Client, PaginationMeta } from '../../core/models/api.models';
import { Product, Supplier, Warehouse } from '../../core/models/catalog.models';
import {
  OrderLinePayload,
  PurchaseOrder,
  SalesOrder,
} from '../../core/models/orders.models';
import { computeTotals, OrderLineDraft } from '../../core/order-totals';
import { OrdersApi } from './orders.api';

type Tab = 'sales' | 'purchases';

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders.page.html',
  styleUrl: './orders.page.scss',
})
export class OrdersPage implements OnInit {
  private readonly api = inject(OrdersApi);

  protected readonly auth = inject(AuthService);

  protected readonly tab = signal<Tab>('sales');
  protected readonly sales = signal<SalesOrder[]>([]);
  protected readonly purchases = signal<PurchaseOrder[]>([]);
  protected readonly meta = signal<PaginationMeta | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly statusFilter = signal('');
  protected readonly busyId = signal<number | null>(null);

  protected readonly clients = signal<Client[]>([]);
  protected readonly suppliers = signal<Supplier[]>([]);
  protected readonly warehouses = signal<Warehouse[]>([]);
  protected readonly products = signal<Product[]>([]);

  protected readonly panelOpen = signal(false);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly partnerId = signal<number | null>(null);
  protected readonly warehouseId = signal<number | null>(null);
  protected readonly draftLines = signal<OrderLineDraft[]>([]);

  protected readonly money = formatMoney;
  protected readonly date = formatDate;

  protected readonly totals = computed(() => computeTotals(this.draftLines()));

  protected readonly canManage = computed(() =>
    this.tab() === 'sales'
      ? this.auth.can('sales_orders.create')
      : this.auth.can('purchase_orders.create'),
  );

  private currentPage = 1;

  ngOnInit(): void {
    this.api.clients().subscribe({ next: (r) => this.clients.set(r.data), error: () => undefined });
    this.api.suppliers().subscribe({ next: (r) => this.suppliers.set(r.data), error: () => undefined });
    this.api.warehouses().subscribe({ next: (r) => this.warehouses.set(r.data), error: () => undefined });
    this.api.products().subscribe({ next: (r) => this.products.set(r.data), error: () => undefined });

    this.load(1);
  }

  protected selectTab(tab: Tab): void {
    if (this.tab() === tab) {
      return;
    }

    this.tab.set(tab);
    this.statusFilter.set('');
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

  protected confirmOrder(order: SalesOrder | PurchaseOrder): void {
    this.run(this.tab() === 'sales' ? this.api.confirmSale(order.id) : this.api.confirmPurchase(order.id), order.id);
  }

  protected advanceOrder(order: SalesOrder | PurchaseOrder): void {
    this.run(this.tab() === 'sales' ? this.api.deliverSale(order.id) : this.api.receivePurchase(order.id), order.id);
  }

  protected statusOf(order: SalesOrder | PurchaseOrder): string {
    return order.status;
  }

  protected canConfirm(order: SalesOrder | PurchaseOrder): boolean {
    return order.status === 'draft' && this.auth.can(this.permission('confirm'));
  }

  protected canAdvance(order: SalesOrder | PurchaseOrder): boolean {
    const advanced = this.tab() === 'sales'
      ? ['confirmed', 'partially_delivered'].includes(order.status)
      : ['confirmed', 'partially_received'].includes(order.status);

    return advanced && this.auth.can(this.permission('advance'));
  }

  protected openPanel(): void {
    this.formError.set(null);
    this.partnerId.set(null);
    this.warehouseId.set(this.warehouses().find((w) => w.is_default)?.id ?? this.warehouses()[0]?.id ?? null);
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
        unit_price: this.defaultPrice(product),
        tax_rate: product?.tax_rate ?? 20,
      },
    ]);
  }

  protected removeLine(index: number): void {
    this.draftLines.update((lines) => lines.filter((_, position) => position !== index));
  }

  protected updateLine(index: number, field: 'quantity' | 'unit_price', value: string): void {
    const numeric = Number(value);

    this.draftLines.update((lines) =>
      lines.map((line, position) =>
        position === index ? { ...line, [field]: Number.isFinite(numeric) ? numeric : 0 } : line,
      ),
    );
  }

  protected selectProduct(index: number, productId: string): void {
    const product = this.products().find((item) => item.id === Number(productId));
    const numericId = productId ? Number(productId) : null;

    this.draftLines.update((lines) =>
      lines.map((line, position) =>
        position === index
          ? {
              ...line,
              product_id: numericId,
              unit_price: this.defaultPrice(product),
              tax_rate: product?.tax_rate ?? 20,
            }
          : line,
      ),
    );
  }

  protected save(): void {
    const lines = this.draftLines();
    const partner = this.partnerId();
    const warehouse = this.warehouseId();

    if (partner === null || warehouse === null) {
      this.formError.set(this.tab() === 'sales' ? 'Sélectionnez un client et un entrepôt.' : 'Sélectionnez un fournisseur et un entrepôt.');

      return;
    }

    if (lines.length === 0 || lines.some((line) => line.product_id === null || line.quantity <= 0)) {
      this.formError.set('Ajoutez au moins une ligne avec un produit et une quantité.');

      return;
    }

    const payload = {
      warehouse_id: warehouse,
      lines: lines.map<OrderLinePayload>((line) => ({
        product_id: line.product_id as number,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_rate: line.tax_rate,
      })),
    };

    const onSuccess = (): void => {
      this.saving.set(false);
      this.panelOpen.set(false);
      this.load(1);
    };

    const onFailure = (error: unknown): void => {
      this.saving.set(false);
      this.formError.set(toApiError(error).message);
    };

    this.saving.set(true);
    this.formError.set(null);

    if (this.tab() === 'sales') {
      this.api
        .createSale({ ...payload, client_id: partner })
        .subscribe({ next: onSuccess, error: onFailure });

      return;
    }

    this.api
      .createPurchase({ ...payload, supplier_id: partner })
      .subscribe({ next: onSuccess, error: onFailure });
  }

  private permission(action: 'confirm' | 'advance'): string {
    if (this.tab() === 'sales') {
      return action === 'confirm' ? 'sales_orders.confirm' : 'sales_orders.deliver';
    }

    return action === 'confirm' ? 'purchase_orders.confirm' : 'purchase_orders.receive';
  }

  private defaultPrice(product: Product | undefined): number {
    if (!product) {
      return 0;
    }

    return this.tab() === 'sales' ? product.sale_price : product.purchase_price;
  }

  private run(request: ReturnType<OrdersApi['confirmSale']>, id: number): void {
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

    const query = { page, per_page: 15, status: this.statusFilter() };

    if (this.tab() === 'sales') {
      this.api.sales(query).subscribe({
        next: (response) => {
          this.currentPage = page;
          this.sales.set(response.data);
          this.meta.set(response.meta);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          this.error.set(toApiError(error).message);
          this.loading.set(false);
        },
      });

      return;
    }

    this.api.purchases(query).subscribe({
      next: (response) => {
        this.currentPage = page;
        this.purchases.set(response.data);
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
