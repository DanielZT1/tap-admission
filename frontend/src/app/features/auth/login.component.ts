import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { SessionService } from '../../core/session.service';

@Component({
  selector: 'tap-login',
  imports: [FormsModule],
  template: `
    <section class="login panel">
      <form (ngSubmit)="submit()">
        <div class="field">
          <label for="email">Usuario</label>
          <input id="email" name="email" type="email" required [(ngModel)]="email">
        </div>
        <div class="field">
          <label for="password">Contrasena</label>
          <input id="password" name="password" type="password" required [(ngModel)]="password">
        </div>
        @if (message) {
          <p class="message">{{ message }}</p>
        }
        <div class="actions">
          <button class="btn primary" type="submit">Ingresar</button>
          <button class="btn ghost" type="button" (click)="recover()">Recuperar</button>
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
  `],
})
export class LoginComponent {
  email = 'admin@tap.local';
  password = 'Password123!';
  message = '';

  constructor(
    private readonly api: ApiService,
    private readonly session: SessionService,
    private readonly router: Router,
  ) {}

  submit(): void {
    this.api.login(this.email, this.password).subscribe({
      next: ({ token, user }) => {
        this.session.save(token, user);
        this.router.navigateByUrl('/products');
      },
      error: () => {
        this.message = 'Credenciales incorrectas o API no disponible.';
      },
    });
  }

  recover(): void {
    if (!this.email) {
      this.message = 'Escribe el correo del usuario.';
      return;
    }

    this.api.recoverPassword(this.email).subscribe({
      next: (response) => {
        this.message = response.message;
      },
      error: () => {
        this.message = 'No fue posible recuperar el usuario.';
      },
    });
  }
}
