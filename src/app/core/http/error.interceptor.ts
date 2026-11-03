import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { TokenStorage } from '../auth/token.storage';

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Normalises any HTTP failure into a readable message (the API already answers
 * in French) and drops the session on a 401.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof HttpErrorResponse) {
    const body = (error.error ?? {}) as { message?: string; errors?: Record<string, string[]> };
    const firstValidationError = body.errors
      ? Object.values(body.errors)[0]?.[0]
      : undefined;

    return {
      status: error.status,
      message: body.message ?? firstValidationError ?? defaultMessage(error.status),
      errors: body.errors,
    };
  }

  return { status: 0, message: 'Une erreur inattendue est survenue.' };
}

function defaultMessage(status: number): string {
  switch (status) {
    case 0:
      return "Le serveur est injoignable. Vérifiez que l'API est démarrée.";
    case 401:
      return 'Votre session a expiré, veuillez vous reconnecter.';
    case 403:
      return "Vous n'avez pas les droits nécessaires pour cette action.";
    case 404:
      return 'Ressource introuvable.';
    case 422:
      return 'Les données saisies sont invalides.';
    default:
      return 'Une erreur est survenue, veuillez réessayer.';
  }
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const router = inject(Router);
  const tokens = inject(TokenStorage);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        tokens.clear();

        if (!router.url.startsWith('/login')) {
          void router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    }),
  );
};
