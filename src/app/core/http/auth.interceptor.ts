import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../environments/environment';
import { TokenStorage } from '../auth/token.storage';

/**
 * Prefixes relative URLs with the API base URL and attaches the bearer token.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = inject(TokenStorage).get();

  let prepared = request;

  if (!/^https?:\/\//i.test(request.url)) {
    const path = request.url.startsWith('/') ? request.url : `/${request.url}`;
    prepared = request.clone({ url: `${environment.apiUrl}${path}` });
  }

  if (token) {
    prepared = prepared.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(prepared);
};
