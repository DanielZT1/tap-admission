import { Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, Subject, catchError, exhaustMap, finalize, tap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { SessionService } from '../../core/session.service';

@Component({
  selector: 'tap-login',
  imports: [FormsModule],
  template: `
    <section class="login panel">
      <form (ngSubmit)="submit()">
        <div class="field">
          <label for="email">Correo</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            [ngModel]="email"
            (ngModelChange)="updateEmail($event)"
          >
        </div>
        <div class="field">
          <label for="password">Contraseña</label>
          <div class="password-field">
            <input
              id="password"
              name="password"
              [type]="showPassword ? 'text' : 'password'"
              required
              [ngModel]="password"
              (ngModelChange)="updatePassword($event)"
            >
            <button
              class="password-toggle"
              type="button"
              [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              [attr.title]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              (click)="showPassword = !showPassword"
            >
              @if (showPassword) {
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M3 3l18 18"></path>
                  <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
                  <path d="M9.9 4.3A9.9 9.9 0 0 1 12 4c5 0 8.5 4.2 10 8a14.5 14.5 0 0 1-2.1 3.4"></path>
                  <path d="M6.6 6.6A14.7 14.7 0 0 0 2 12c1.5 3.8 5 8 10 8a9.7 9.7 0 0 0 4.7-1.2"></path>
                </svg>
              } @else {
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              }
            </button>
          </div>
        </div>
        @if (message) {
          <p class="message">{{ message }}</p>
        }
        <div class="actions">
          <button class="btn primary" type="submit" [disabled]="isSubmitting || isRecovering">
            {{ isSubmitting ? 'Ingresando...' : 'Ingresar' }}
          </button>
          <button class="btn ghost" type="button" [disabled]="isSubmitting || isRecovering" (click)="recover()">
            {{ isRecovering ? 'Enviando...' : 'Recuperar' }}
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .login {
      margin: 8vh auto 0;
      max-width: 420px;
    }
    form {
      display: grid;
      gap: 16px;
    }
    .message {
      color: #b91c1c;
      margin: 0;
    }
    .password-field {
      position: relative;
    }
    .password-field input {
      padding-right: 50px;
      width: 100%;
    }
    .password-toggle {
      align-items: center;
      background: #e5e7eb;
      border: 0;
      border-radius: 6px;
      color: #0f172a;
      cursor: pointer;
      display: inline-flex;
      height: 30px;
      justify-content: center;
      padding: 0;
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      transition: background var(--motion-fast) ease, transform var(--motion-fast) ease;
      width: 34px;
    }
    .password-toggle svg {
      fill: none;
      height: 18px;
      stroke: currentColor;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 2;
      width: 18px;
    }
    .password-toggle:hover {
      background: #dbe2ea;
      transform: translateY(-50%) scale(1.02);
    }
  `],
})
export class LoginComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly loginRequests = new Subject<void>();
  private readonly recoverRequests = new Subject<void>();
  private lastLoginAttemptKey = '';

  email = 'admin@tap.local';
  password = 'Password123!';
  message = '';
  isSubmitting = false;
  isRecovering = false;
  showPassword = false;

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
    private readonly router: Router,
  ) {
    this.loginRequests.pipe(
      exhaustMap(() => {
        const attemptKey = this.loginAttemptKey();

        if (attemptKey === this.lastLoginAttemptKey) {
          this.message = 'Ya se intento ingresar con estas credenciales. Modifica usuario o contraseña para volver a intentar.';
          return EMPTY;
        }

        this.message = '';
        this.isSubmitting = true;
        this.lastLoginAttemptKey = attemptKey;

        return this.api.login(this.email, this.password).pipe(
          tap(({ token, user }) => {
            this.session.save(token, user);
            this.router.navigateByUrl('/products');
          }),
          catchError(() => {
            this.session.clear();
            this.message = 'Credenciales incorrectas o API no disponible.';
            return EMPTY;
          }),
          finalize(() => this.isSubmitting = false),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.recoverRequests.pipe(
      exhaustMap(() => {
        if (!this.email) {
          this.message = 'Escribe el correo del usuario.';
          return EMPTY;
        }

        this.message = '';
        this.isRecovering = true;

        return this.api.recoverPassword(this.email).pipe(
          tap((response) => this.message = response.message),
          catchError(() => {
            this.message = 'No fue posible recuperar el usuario.';
            return EMPTY;
          }),
          finalize(() => this.isRecovering = false),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  submit(): void {
    this.loginRequests.next();
  }

  recover(): void {
    this.recoverRequests.next();
  }

  updateEmail(value: string): void {
    this.email = value;
    this.clearLoginAttempt();
  }

  updatePassword(value: string): void {
    this.password = value;
    this.clearLoginAttempt();
  }

  private clearLoginAttempt(): void {
    this.lastLoginAttemptKey = '';
    this.message = '';
  }

  private loginAttemptKey(): string {
    return `${this.email.trim().toLowerCase()}\u0000${this.password}`;
  }
}
