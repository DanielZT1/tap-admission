import { Component, computed } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { ApiService } from './core/api.service';
import { SessionService } from './core/session.service';

@Component({
  selector: 'tap-root',
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <strong>TAP</strong>
          <span>Desarrollo</span>
        </div>
        @if (session.user()) {
          <nav>
            @if (session.can('products')) {
              <a routerLink="/products">Productos</a>
            }
            @if (session.can('users')) {
              <a routerLink="/users">Usuarios</a>
            }
            @if (session.can('profiles')) {
              <a routerLink="/profiles">Perfiles</a>
            }
          </nav>
        }
      </aside>
      <main class="content">
        <header class="topbar">
          <div>
            <h1>{{ title() }}</h1>
            <p>{{ subtitle() }}</p>
          </div>
          @if (session.user()) {
            <div class="account">
              <span>{{ session.user()?.name }}</span>
              <button class="btn secondary" type="button" (click)="logout()">Salir</button>
            </div>
          }
        </header>
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .shell {
      display: grid;
      grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
      min-height: 100vh;
      width: 100%;
    }
    .sidebar {
      background: #101827;
      color: #e5e7eb;
      padding: 22px;
      min-width: 0;
    }
    .brand {
      display: grid;
      gap: 2px;
      margin-bottom: 28px;
    }
    .brand strong {
      font-size: 24px;
    }
    .brand span {
      color: #93a4b8;
      font-size: 13px;
    }
    nav {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    nav a {
      border-radius: 6px;
      color: #e5e7eb;
      font-weight: 700;
      min-width: 0;
      padding: 10px 12px;
      text-decoration: none;
    }
    nav a:hover {
      background: #1f2937;
    }
    .content {
      padding: 24px;
      min-width: 0;
      width: 100%;
    }
    .topbar {
      align-items: center;
      display: flex;
      gap: 16px;
      justify-content: space-between;
      margin-bottom: 20px;
      min-width: 0;
    }
    .topbar > div:first-child {
      min-width: 0;
    }
    .topbar h1 {
      font-size: 24px;
      margin: 0;
      overflow-wrap: anywhere;
    }
    .topbar p {
      color: #64748b;
      margin: 4px 0 0;
      overflow-wrap: anywhere;
    }
    .account {
      align-items: center;
      display: flex;
      gap: 10px;
      flex: 0 0 auto;
      max-width: 100%;
    }
    .account span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @media (max-width: 980px) {
      .shell {
        grid-template-columns: 1fr;
      }
      .sidebar {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        justify-content: space-between;
        padding: 14px 16px;
      }
      .brand {
        margin-bottom: 0;
      }
      nav {
        flex-direction: row;
        flex-wrap: wrap;
      }
      nav a {
        padding: 8px 10px;
      }
      .content {
        padding: 16px;
      }
    }
    @media (max-width: 640px) {
      .topbar {
        align-items: flex-start;
        flex-direction: column;
      }
      .account {
        justify-content: space-between;
        width: 100%;
      }
    }
  `],
})
export class AppComponent {
  readonly title = computed(() => this.session.user() ? 'Panel administrativo' : 'Acceso al sistema');
  readonly subtitle = computed(() => this.session.user() ? 'Gestion de catalogos y permisos' : 'Ingresa con tus credenciales');

  constructor(
    readonly session: SessionService,
    private readonly api: ApiService,
    private readonly router: Router,
  ) {}

  logout(): void {
    this.api.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  private finishLogout(): void {
    this.session.clear();
    this.router.navigateByUrl('/login');
  }
}
