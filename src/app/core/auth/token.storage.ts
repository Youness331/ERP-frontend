import { Injectable } from '@angular/core';

const TOKEN_KEY = 'erp.token';

/**
 * Persists the Sanctum bearer token.
 *
 * `localStorage` can throw in private mode or during SSR, so every access is
 * guarded and an in-memory copy keeps the session usable for the tab.
 */
@Injectable({ providedIn: 'root' })
export class TokenStorage {
  private memory: string | null = null;

  get(): string | null {
    if (this.memory !== null) {
      return this.memory;
    }

    try {
      const stored = localStorage.getItem(TOKEN_KEY);

      if (stored) {
        this.memory = stored;
      }
    } catch {
      // Storage unavailable: stay in memory only.
    }

    return this.memory;
  }

  set(token: string): void {
    this.memory = token;

    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Ignore storage failures, the in-memory token still works.
    }
  }

  clear(): void {
    this.memory = null;

    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore.
    }
  }

  has(): boolean {
    return this.get() !== null;
  }
}
