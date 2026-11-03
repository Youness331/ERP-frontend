import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { Client } from '../../core/models/api.models';
import { ClientsPage } from './clients.page';

const CLIENT: Client = {
  id: 1,
  code: 'CLI-00001',
  name: 'Atlas Distribution',
  company_name: 'Atlas Distribution SARL',
  email: 'contact@atlas.ma',
  phone: '+212 5 22 11 22 33',
  mobile: null,
  address: null,
  city: 'Casablanca',
  postal_code: null,
  country: 'Maroc',
  ice: '002345678000012',
  tax_id: null,
  rc: null,
  patente: null,
  credit_limit: 25000,
  notes: null,
  is_active: true,
  created_at: '2026-11-02T10:00:00+01:00',
  updated_at: '2026-11-02T10:00:00+01:00',
};

describe('ClientsPage', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClientsPage],
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  function createPage() {
    const fixture = TestBed.createComponent(ClientsPage);
    fixture.detectChanges();
    controller.expectOne((request) => request.url === `${environment.apiUrl}/clients`).flush({
      data: [CLIENT],
      meta: { current_page: 1, per_page: 15, total: 1, last_page: 1 },
      links: { first: null, last: null, prev: null, next: null },
    });
    fixture.detectChanges();

    return fixture;
  }

  it('lists the clients returned by the API', () => {
    const fixture = createPage();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Atlas Distribution');
    expect(text).toContain('CLI-00001');
    expect(text).toContain('Casablanca');
  });

  it('sends the search term to the API', () => {
    const fixture = createPage();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input[type="search"]') as HTMLInputElement;

    input.value = 'atlas';
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const request = controller.expectOne(
      (req) => req.url === `${environment.apiUrl}/clients` && req.params.get('search') === 'atlas',
    );

    expect(request.request.params.get('search')).toBe('atlas');
    expect(request.request.params.get('page')).toBe('1');

    request.flush({ data: [], meta: { current_page: 1, per_page: 15, total: 0, last_page: 1 }, links: {} });
  });
});
