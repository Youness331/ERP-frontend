import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { QuotesPage } from './quotes.page';

const QUOTE = {
  id: 8,
  reference: 'DEV-2026-0003',
  status: 'accepted' as const,
  status_label: 'Accepté',
  quote_date: '2026-11-02',
  valid_until: '2026-12-02',
  client: { id: 4, name: 'Atlas Distribution' },
  warehouse: { id: 1, name: 'Entrepôt Principal' },
  subtotal: 1200,
  discount_total: 0,
  tax_total: 240,
  total: 1440,
  notes: null,
  sales_order_id: null,
  is_expired: false,
  can_be_converted: true,
  created_at: '2026-11-02T10:00:00+01:00',
};

const PAGE = { current_page: 1, per_page: 15, total: 1, last_page: 1 };

describe('QuotesPage', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [QuotesPage],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        // Every action is rendered, so the specs can exercise them.
        { provide: AuthService, useValue: { can: () => true } },
      ],
    });

    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function createPage() {
    const fixture = TestBed.createComponent(QuotesPage);
    fixture.detectChanges();

    controller.expectOne((r) => r.url === `${environment.apiUrl}/clients`).flush({ data: [], meta: PAGE, links: {} });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/warehouses`).flush({ data: [], meta: PAGE, links: {} });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/products`).flush({ data: [], meta: PAGE, links: {} });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/quotes`).flush({
      data: [QUOTE],
      meta: PAGE,
      links: {},
    });

    fixture.detectChanges();

    return fixture;
  }

  it('lists the quotes with their status', () => {
    const fixture = createPage();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('DEV-2026-0003');
    expect(text).toContain('Atlas Distribution');
    expect(text).toContain('Accepté');
  });

  it('converts an accepted quote into an order', () => {
    const fixture = createPage();
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ) as HTMLButtonElement[];
    const convert = buttons.find((button) => button.textContent?.includes('Convertir'));

    expect(convert).toBeTruthy();
    convert?.click();

    controller.expectOne(`${environment.apiUrl}/quotes/8/convert`).flush({ data: { id: 21 } });

    controller.expectOne((r) => r.url === `${environment.apiUrl}/quotes`).flush({
      data: [{ ...QUOTE, status: 'converted', status_label: 'Converti', can_be_converted: false }],
      meta: PAGE,
      links: {},
    });
  });
});
