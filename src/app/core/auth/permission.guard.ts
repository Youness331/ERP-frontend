import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from './auth.service';

/**
 * Requires a specific permission, mirroring the backend RBAC.
 */
export const permissionGuard = (permission: string): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.can(permission) ? true : router.createUrlTree(['/dashboard']);
};
