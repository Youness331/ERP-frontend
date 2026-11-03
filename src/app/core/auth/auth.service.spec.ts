import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { authInterceptor } from '../http/auth.interceptor';
import { AuthUser } from '../models/api.models';
import { AuthService } from './auth.service';
import { TokenStorage } from './token.storage';

const USER: AuthUser = {
  id: 1,
  name: 'Youssef El Amrani',
  email: 'admin@erp.test',
  job_title: 'Directeur',
  is_active: true,
  role: { id: 1, name: 'admin', label: 'Administrateur' },
  permissions: ['dashboard.view', 'clients.view'],
  is_admin: true,
  last_login_at: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let tokens: TokenStorage;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStorage);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('stores the token and the profile on login', () => {
    let email: string | undefined;

    service.login({ email: 'admin@erp.test', password: 'Password123!' }).subscribe((user) => {
      email = user.email;
    });

    const request = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    request.flush({ token: 'token-123', token_type: 'Bearer', user: USER });

    expect(tokens.get()).toBe('token-123');
    expect(service.isAuthenticated()).toBeTrue();
    expect(email).toBe('admin@erp.test');
  });

  it('restores the session from the stored token', () => {
    tokens.set('token-123');

    service.restore().subscribe();

    const request = http.expectOne(`${environment.apiUrl}/auth/me`);
    request.flush({ data: USER });

    expect(service.user()).toEqual(USER);
  });

  it('skips the call when there is no token', () => {
    let result: AuthUser | null | undefined;

    service.restore().subscribe((user) => (result = user));

    http.expectNone(`${environment.apiUrl}/auth/me`);
    expect(result).toBeNull();
  });

  it('clears the session when the token is rejected', () => {
    tokens.set('expired');

    service.restore().subscribe();

    http
      .expectOne(`${environment.apiUrl}/auth/me`)
      .flush({ message: 'Authentification requise.' }, { status: 401, statusText: 'Unauthorized' });

    expect(tokens.get()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('grants every permission to administrators and only listed ones to others', () => {
    service.login({ email: 'admin@erp.test', password: 'x' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 't',
      token_type: 'Bearer',
      user: { ...USER, is_admin: true, permissions: [] },
    });

    expect(service.can('clients.delete')).toBeTrue();

    service.login({ email: 'sales@erp.test', password: 'x' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush({
      token: 't2',
      token_type: 'Bearer',
      user: { ...USER, is_admin: false, permissions: ['clients.view'] },
    });

    expect(service.can('clients.view')).toBeTrue();
    expect(service.can('clients.delete')).toBeFalse();
  });
});
