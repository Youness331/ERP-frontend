import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Allows the route when a session exists, restoring it from the stored token
 * when the page is reloaded.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  if (auth.hasToken()) {
    return auth.restore().pipe(map((user) => (user ? true : router.createUrlTree(['/login']))));
  }

  return router.createUrlTree(['/login']);
};
