import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { ReportsPage } from './reports.page';

const SALES = {
  period: { from: '2026-11-01', to: '2026-11-30' },
  invoice_count: 5,
  revenue: 125400.5,
  tax_collected: 25080.1,
  discounts_granted: 1200,
  average_invoice: 25080.1,
  by_month: [{ month: '2026-11', total: 125400.5 }],
  top_products: [{ product_id: 7, name: 'Ramette A4', sku: 'REF-0007', quantity: 96, revenue: 24120 }],
  top_clients: [{ client_id: 4, client: 'Atlas Distribution', revenue: 60000, invoices: 3 }],
};

const AGING = {
  total: 45200,
  invoice_count: 3,
  buckets: [
    { key: 'current', label: 'Non échu', amount: 10000, count: 1 },
    { key: 'days_1_30', label: '1 à 30 jours', amount: 20000, count: 1 },
    { key: 'days_31_60', label: '31 à 60 jours', amount: 0, count: 0 },
    { key: 'days_61_90', label: '61 à 90 jours', amount: 0, count: 0 },
    { key: 'over_90', label: 'Plus de 90 jours', amount: 15200, count: 1 },
  ],
};

describe('ReportsPage', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReportsPage],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function createPage() {
    const fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();

    controller.expectOne((r) => r.url === `${environment.apiUrl}/reports/sales`).flush({ data: SALES });
    fixture.detectChanges();

    return fixture;
  }

  it('renders the sales report', () => {
    const fixture = createPage();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toMatch(/125\s400,50\sDH/);
    expect(text).toContain('5 facture(s)');
    expect(text).toContain('Ramette A4');
    expect(text).toContain('Atlas Distribution');
  });

  it('loads the aged receivables when the tab changes', () => {
    const fixture = createPage();
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll('.tabs button');

    (tabs[3] as HTMLButtonElement).click();
    fixture.detectChanges();

    controller.expectOne((r) => r.url === `${environment.apiUrl}/reports/receivables-aging`).flush({
      data: AGING,
    });
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Plus de 90 jours');
    expect(text).toMatch(/15\s200,00\sDH/);
  });
});
