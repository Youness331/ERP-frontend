import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { BankPage } from './bank.page';

const LINE = {
  id: 5,
  reference: 'VIR-8891',
  label: 'VIR CLIENT ATLAS',
  amount: 240,
  direction: 'in' as const,
  direction_label: 'Encaissement',
  value_date: '2026-11-03',
  status: 'unmatched' as const,
  status_label: 'Non rapprochée',
  payment_id: null,
  matched_at: null,
  created_at: '2026-11-03T10:00:00+01:00',
};

const PAYMENT = {
  id: 31,
  reference: 'PAY-2026-0004',
  payable_type: 'App\\Models\\Invoice',
  payable_id: 12,
  direction: 'in' as const,
  direction_label: 'Encaissement',
  method: 'bank_transfer' as const,
  method_label: 'Virement bancaire',
  amount: 240,
  payment_date: '2026-11-02',
  reference_number: 'VIR-8891',
  notes: null,
  created_at: '2026-11-02T10:00:00+01:00',
};

const PAGE = { current_page: 1, per_page: 15, total: 1, last_page: 1 };

describe('BankPage', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BankPage],
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
    const fixture = TestBed.createComponent(BankPage);
    fixture.detectChanges();

    controller.expectOne((r) => r.url === `${environment.apiUrl}/bank-lines/summary`).flush({
      data: { unmatched: 1, matched: 0, ignored: 0 },
    });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/bank-lines`).flush({
      data: [LINE],
      meta: PAGE,
      links: {},
    });
    fixture.detectChanges();

    return fixture;
  }

  it('lists the statement lines with their status', () => {
    const fixture = createPage();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('VIR CLIENT ATLAS');
    expect(text).toContain('Non rapprochée');
    expect(text).toContain('240,00 DH');
  });

  it('matches a line with a suggested payment', () => {
    const fixture = createPage();
    const element = fixture.nativeElement as HTMLElement;
    const reconcile = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Rapprocher'),
    ) as HTMLButtonElement | undefined;

    reconcile?.click();

    controller.expectOne(`${environment.apiUrl}/bank-lines/5/suggestions`).flush({
      data: [PAYMENT],
      meta: PAGE,
      links: {},
    });
    fixture.detectChanges();

    const associate = Array.from(element.querySelectorAll('.suggestions button')).find((button) =>
      button.textContent?.includes('Associer'),
    ) as HTMLButtonElement | undefined;

    associate?.click();

    const request = controller.expectOne(`${environment.apiUrl}/bank-lines/5/match`);
    expect(request.request.body).toEqual({ payment_id: 31 });
    request.flush({ data: { ...LINE, status: 'matched', payment_id: 31 } });

    controller.expectOne((r) => r.url === `${environment.apiUrl}/bank-lines/summary`).flush({
      data: { unmatched: 0, matched: 1, ignored: 0 },
    });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/bank-lines`).flush({
      data: [],
      meta: PAGE,
      links: {},
    });
  });
});
