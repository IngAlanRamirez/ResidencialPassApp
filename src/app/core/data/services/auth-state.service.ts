import { Injectable, signal, computed } from '@angular/core';
import type { CurrentUser } from '../../domain/models/user.model';

const TOKEN_KEY = 'residencial_pass_token';
const USER_KEY = 'residencial_pass_user';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly _currentUser = signal<CurrentUser | null>(null);
  private readonly _accessToken = signal<string | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  readonly currentUser = this._currentUser.asReadonly();
  readonly accessToken = this._accessToken.asReadonly();

  readonly isAdmin = computed(
    () => this._currentUser()?.role === 'admin'
  );

  readonly isVecino = computed(
    () => this._currentUser()?.role === 'vecino'
  );

  readonly isVigilancia = computed(
    () => this._currentUser()?.role === 'vigilancia'
  );

  readonly isLoggedIn = computed(() => !!this._accessToken());

  setSession(accessToken: string, user: CurrentUser): void {
    this._accessToken.set(accessToken);
    this._currentUser.set(user);
    try {
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
    }
  }

  loadFromStorage(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const token = localStorage.getItem(TOKEN_KEY);
      const userJson = localStorage.getItem(USER_KEY);
      if (token && userJson) {
        const user = JSON.parse(userJson) as CurrentUser;
        this._accessToken.set(token);
        this._currentUser.set(user);
      }
    } catch {
      this.clear();
    }
  }

  clear(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  }

  /** Cierra la sesión (borra token y usuario en memoria y en localStorage). */
  logout(): void {
    this.clear();
  }

  getToken(): string | null {
    return this._accessToken();
  }
}
