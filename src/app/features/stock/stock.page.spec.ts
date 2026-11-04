import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { StockPage } from './stock.page';

const LEVEL = {
  id: 1,
  product_id: 7,
  warehouse_id: 2,
  product: {
    id: 7,
    sku: 'REF-0007',
    barcode: null,
    name: 'Ramette A4',
    description: null,
    category_id: null,
    unit: 'carton',
    purchase_price: 180,
    sale_price: 240,
    cost_price: 180,
    tax_rate: 20,
    reorder_level: 10,
    track_stock: true,
    is_active: true,
    created_at: '2026-11-02T10:00:00+01:00',
    updated_at: '2026-11-02T10:00:00+01:00',
  },
  warehouse: {
    id: 2,
    code: 'WH-002',
    name: 'Entrepôt Anfa',
    address: null,
    city: 'Casablanca',
    phone: null,
    is_default: false,
    is_active: true,
  },
  quantity: 42,
  reserved_quantity: 2,
  available_quantity: 40,
  updated_at: '2026-11-02T10:00:00+01:00',
};

const MOVEMENT = {
  id: 9,
  type: 'in' as const,
  type_label: 'Entrée',
  quantity: 12,
  quantity_before: 30,
  quantity_after: 42,
  unit_cost: 180,
  reason: 'Réception fournisseur',
  reference_type: 'App\\Models\\PurchaseOrder',
  reference_id: 3,
  product: LEVEL.product,
  warehouse: LEVEL.warehouse,
  user: { id: 1, name: 'Hicham Ouahbi' },
  created_at: '2026-11-02T10:00:00+01:00',
};

describe('StockPage', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StockPage],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function createPage() {
    const fixture = TestBed.createComponent(StockPage);
    fixture.detectChanges();

    controller.expectOne((request) => request.url === `${environment.apiUrl}/warehouses`).flush({
      data: [LEVEL.warehouse],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
      links: {},
    });

    controller.expectOne((request) => request.url === `${environment.apiUrl}/products`).flush({
      data: [LEVEL.product],
      meta: { current_page: 1, per_page: 100, total: 1, last_page: 1 },
      links: {},
    });

    controller.expectOne((request) => request.url === `${environment.apiUrl}/stock`).flush({
      data: [LEVEL],
      meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
      links: {},
    });

    fixture.detectChanges();

    return fixture;
  }

  it('shows the stock levels with their availability', () => {
    const fixture = createPage();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Ramette A4');
    expect(text).toContain('Entrepôt Anfa');
    expect(text).toContain('42');
    expect(text).toContain('40');
  });

  it('loads the movement ledger when the tab changes', () => {
    const fixture = createPage();
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll('.tabs button');

    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const request = controller.expectOne(
      (req) => req.url === `${environment.apiUrl}/stock/movements`,
    );
    request.flush({
      data: [MOVEMENT],
      meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
      links: {},
    });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Réception fournisseur');
    expect(text).toContain('Hicham Ouahbi');
  });
});
