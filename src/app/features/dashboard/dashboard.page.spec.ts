import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { DashboardSummary } from '../../core/models/api.models';
import { DashboardPage } from './dashboard.page';

const SUMMARY: DashboardSummary = {
  company: {
    name: 'Atlas Operations SARL',
    city: 'Casablanca',
    address: '12, bd Zerktouni',
    country: 'Maroc',
    phone: '+212 5 22 00 00 00',
    email: 'contact@atlas-operations.ma',
    ice: '001234567000089',
    tax_id: '12345678',
    rc: 'RC 123456',
    patente: 'PAT 654321',
  },
  currency: { code: 'MAD', symbol: 'DH', decimals: 2 },
  period: { from: '2026-11-01', to: '2026-11-30' },
  revenue: {
    current_month: 125400.5,
    previous_month: 98200,
    growth_percent: 27.7,
    collected_this_month: 84000,
  },
  receivables: { outstanding: 45200, overdue_amount: 12000, overdue_count: 2 },
  sales: { open_orders: 5, to_deliver: 3, orders_this_month: 4 },
  purchasing: { pending_orders: 2, orders_this_month: 1 },
  inventory: { low_stock_count: 3, stock_value: 318900, product_count: 24 },
  partners: { clients: 14, suppliers: 8 },
  charts: {
    sales_last_12_months: [
      { month: '2026-10', label: 'oct. 2026', total: 88000 },
      { month: '2026-11', label: 'nov. 2026', total: 125400.5 },
    ],
  },
  top_products: [],
  low_stock_products: [
    { id: 7, sku: 'REF-0007', name: 'Ramette A4', reorder_level: 10, quantity: 4 },
  ],
  recent_invoices: [
    {
      id: 12,
      reference: 'FAC-2026-0009',
      client: 'Atlas Distribution',
      status: 'sent',
      status_label: 'Envoyée',
      issue_date: '2026-11-02',
      total: 4800,
      balance_due: 4800,
    },
  ],
};

describe('DashboardPage', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  it('renders the headline figures from the API', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    controller.expectOne(`${environment.apiUrl}/dashboard`).flush({ data: SUMMARY });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toMatch(/125\s400,50\sDH/);
    expect(text).toContain('+27,70 %');
    expect(text).toContain('FAC-2026-0009');
    expect(text).toContain('Ramette A4');
  });

  it('shows a retry action when the API fails', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();

    controller
      .expectOne(`${environment.apiUrl}/dashboard`)
      .flush({ message: 'Serveur indisponible.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Serveur indisponible.');
    expect(element.querySelector('button')?.textContent).toContain('Réessayer');
  });
});
