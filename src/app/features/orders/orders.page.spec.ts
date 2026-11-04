import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { OrdersPage } from './orders.page';

const SALE = {
  id: 21,
  reference: 'SO-2026-0004',
  status: 'confirmed' as const,
  status_label: 'Confirmée',
  order_date: '2026-11-02',
  delivery_date: null,
  client: { id: 4, name: 'Atlas Distribution' },
  warehouse: { id: 1, name: 'Entrepôt Principal' },
  subtotal: 1200,
  discount_total: 0,
  tax_total: 240,
  total: 1440,
  notes: null,
  created_at: '2026-11-02T10:00:00+01:00',
};

const PURCHASE = {
  id: 12,
  reference: 'PO-2026-0002',
  status: 'confirmed' as const,
  status_label: 'Confirmée',
  order_date: '2026-11-01',
  expected_date: null,
  received_at: null,
  supplier: { id: 3, name: 'Papeterie du Nord' },
  warehouse: { id: 1, name: 'Entrepôt Principal' },
  subtotal: 500,
  discount_total: 0,
  tax_total: 100,
  total: 600,
  amount_paid: 0,
  balance_due: 600,
  notes: null,
  created_at: '2026-11-01T10:00:00+01:00',
};

const PAGE = { current_page: 1, per_page: 15, total: 1, last_page: 1 };

describe('OrdersPage', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrdersPage],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function createPage() {
    const fixture = TestBed.createComponent(OrdersPage);
    fixture.detectChanges();

    controller.expectOne((r) => r.url === `${environment.apiUrl}/clients`).flush({ data: [], meta: PAGE, links: {} });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/suppliers`).flush({ data: [], meta: PAGE, links: {} });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/warehouses`).flush({ data: [], meta: PAGE, links: {} });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/products`).flush({ data: [], meta: PAGE, links: {} });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/sales-orders`).flush({
      data: [SALE],
      meta: PAGE,
      links: {},
    });

    fixture.detectChanges();

    return fixture;
  }

  it('lists the sales orders with their status', () => {
    const fixture = createPage();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('SO-2026-0004');
    expect(text).toContain('Atlas Distribution');
    expect(text).toContain('Confirmée');
  });

  it('switches to the purchase orders', () => {
    const fixture = createPage();
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll('.tabs button');

    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    controller.expectOne((r) => r.url === `${environment.apiUrl}/purchase-orders`).flush({
      data: [PURCHASE],
      meta: PAGE,
      links: {},
    });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('PO-2026-0002');
    expect(text).toContain('Papeterie du Nord');
  });
});
