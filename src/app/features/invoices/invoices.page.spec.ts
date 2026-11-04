import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { InvoicesPage } from './invoices.page';

const INVOICE = {
  id: 12,
  reference: 'FAC-2026-0009',
  type: 'invoice' as const,
  type_label: 'Facture',
  status: 'sent' as const,
  status_label: 'Envoyée',
  issue_date: '2026-11-02',
  due_date: '2026-12-02',
  client: { id: 4, name: 'Atlas Distribution' },
  subtotal: 200,
  discount_total: 0,
  tax_total: 40,
  total: 240,
  amount_paid: 0,
  credited_amount: 0,
  balance_due: 240,
  is_overdue: false,
  parent_invoice_id: null,
  notes: null,
  created_at: '2026-11-02T10:00:00+01:00',
};

const PAGE = { current_page: 1, per_page: 15, total: 1, last_page: 1 };

describe('InvoicesPage', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [InvoicesPage],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { can: () => true } },
      ],
    });

    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function createPage() {
    const fixture = TestBed.createComponent(InvoicesPage);
    fixture.detectChanges();

    controller.expectOne((request) => request.url === `${environment.apiUrl}/invoices`).flush({
      data: [INVOICE],
      meta: PAGE,
      links: {},
    });
    fixture.detectChanges();

    return fixture;
  }

  it('lists the invoices with their balance', () => {
    const fixture = createPage();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('FAC-2026-0009');
    expect(text).toContain('Atlas Distribution');
    expect(text).toContain('240,00 DH');
  });

  it('records a payment on the selected invoice', () => {
    const fixture = createPage();
    const element = fixture.nativeElement as HTMLElement;
    const payButton = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Encaisser'),
    ) as HTMLButtonElement | undefined;

    expect(payButton).toBeTruthy();
    payButton?.click();
    fixture.detectChanges();

    const saveButton = Array.from(element.querySelectorAll('.panel button')).find((button) =>
      button.textContent?.includes('Encaisser'),
    ) as HTMLButtonElement | undefined;

    saveButton?.click();

    const request = controller.expectOne(`${environment.apiUrl}/invoices/12/payments`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body.amount).toBe(240);

    request.flush({ data: { id: 1 } });

    controller.expectOne((req) => req.url === `${environment.apiUrl}/invoices`).flush({
      data: [{ ...INVOICE, status: 'paid', status_label: 'Payée', balance_due: 0, amount_paid: 240 }],
      meta: PAGE,
      links: {},
    });
  });
});
