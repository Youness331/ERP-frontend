import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { authInterceptor } from '../../core/http/auth.interceptor';
import { AdminPage } from './admin.page';

const USER = {
  id: 1,
  name: 'Youssef El Amrani',
  email: 'admin@erp.test',
  phone: null,
  job_title: 'Directeur des opérations',
  is_active: true,
  role: { id: 1, name: 'admin', label: 'Administrateur' },
  last_login_at: '2026-11-02T09:00:00+01:00',
  created_at: '2026-11-01T09:00:00+01:00',
};

const ROLES = [
  { id: 1, name: 'admin', label: 'Administrateur', description: null, permissions: ['users.view', 'clients.view'] },
  { id: 2, name: 'sales', label: 'Commercial', description: null, permissions: ['clients.view'] },
];

const GROUPS = [
  {
    module: 'clients',
    permissions: [
      { id: 1, name: 'clients.view', label: 'Consulter les clients' },
      { id: 2, name: 'clients.create', label: 'Créer un client' },
    ],
  },
  {
    module: 'users',
    permissions: [{ id: 3, name: 'users.view', label: 'Consulter les utilisateurs' }],
  },
];

const PAGE = { current_page: 1, per_page: 15, total: 1, last_page: 1 };

describe('AdminPage', () => {
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminPage],
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
    const fixture = TestBed.createComponent(AdminPage);
    fixture.detectChanges();

    controller.expectOne((r) => r.url === `${environment.apiUrl}/roles`).flush({ data: ROLES });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/permissions`).flush({ data: GROUPS });
    controller.expectOne((r) => r.url === `${environment.apiUrl}/users`).flush({
      data: [USER],
      meta: PAGE,
      links: {},
    });
    fixture.detectChanges();

    return fixture;
  }

  it('lists the users with their role', () => {
    const fixture = createPage();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Youssef El Amrani');
    expect(text).toContain('admin@erp.test');
    expect(text).toContain('Administrateur');
  });

  it('renders the permission matrix per role', () => {
    const fixture = createPage();
    const tabs = (fixture.nativeElement as HTMLElement).querySelectorAll('.tabs button');

    (tabs[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const rows = Array.from(element.querySelectorAll('tbody tr'));

    expect(element.textContent).toContain('Consulter les clients');

    const clientsViewRow = rows.find((row) => row.textContent?.includes('Consulter les clients'));
    const checks = clientsViewRow?.querySelectorAll('.check') ?? [];

    expect(checks.length).toBe(2);
  });
});
