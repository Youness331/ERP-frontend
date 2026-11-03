import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { TokenStorage } from '../auth/token.storage';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;
  let tokens: TokenStorage;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    tokens = TestBed.inject(TokenStorage);
  });

  afterEach(() => controller.verify());

  it('prefixes relative urls with the api base url', () => {
    http.get('/clients').subscribe();

    const request = controller.expectOne(`${environment.apiUrl}/clients`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('adds the bearer token when a session exists', () => {
    tokens.set('secret-token');

    http.get('/clients').subscribe();

    const request = controller.expectOne(`${environment.apiUrl}/clients`);
    expect(request.request.headers.get('Authorization')).toBe('Bearer secret-token');
    request.flush({});
  });

  it('leaves absolute urls untouched', () => {
    http.get('https://example.com/ping').subscribe();

    const request = controller.expectOne('https://example.com/ping');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });
});
