import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, tap } from 'rxjs';

import { ApiEnvelope, AuthUser, LoginResponse } from '../models/api.models';
import { TokenStorage } from './token.storage';

export interface Credentials {
  email: string;
  password: string;
}

/**
 * Holds the authenticated user and exposes the permission checks used by
 * guards, menus and buttons.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStorage);
  private readonly router = inject(Router);

  private readonly currentUser = signal<AuthUser | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly permissions = computed(() => this.currentUser()?.permissions ?? []);

  login(credentials: Credentials): Observable<AuthUser> {
    return this.http.post<LoginResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        this.tokens.set(response.token);
        this.currentUser.set(response.user);
      }),
      map((response) => response.user),
    );
  }

  /**
   * Reloads the profile from a stored token (called at startup).
   */
  restore(): Observable<AuthUser | null> {
    if (!this.tokens.has()) {
      return of(null);
    }

    return this.http.get<ApiEnvelope<AuthUser>>('/auth/me').pipe(
      map((response) => response.data),
      tap((user) => this.currentUser.set(user)),
      catchError(() => {
        this.tokens.clear();
        this.currentUser.set(null);

        return of(null);
      }),
    );
  }

  logout(): void {
    const done = () => this.clearSession();

    this.http.post('/auth/logout', {}).subscribe({ next: done, error: done });
  }

  /**
   * Administrators implicitly hold every permission.
   */
  can(permission: string): boolean {
    const user = this.currentUser();

    return user !== null && (user.is_admin || user.permissions.includes(permission));
  }

  hasToken(): boolean {
    return this.tokens.has();
  }

  private clearSession(): void {
    this.tokens.clear();
    this.currentUser.set(null);
    void this.router.navigate(['/login']);
  }
}
