import { Injectable, signal } from '@angular/core';
import { SessionUser } from './api.models';

const tokenKey = 'tap_token';
const userKey = 'tap_user';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly user = signal<SessionUser | null>(this.readUser());
  readonly token = signal<string | null>(localStorage.getItem(tokenKey));

  save(token: string, user: SessionUser): void {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(userKey, JSON.stringify(user));
    this.token.set(token);
    this.user.set(user);
  }

  clear(): void {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(userKey);
    this.token.set(null);
    this.user.set(null);
  }

  can(section: string): boolean {
    return this.user()?.sections.includes(section) ?? false;
  }

  private readUser(): SessionUser | null {
    const raw = localStorage.getItem(userKey);
    return raw ? JSON.parse(raw) as SessionUser : null;
  }
}
