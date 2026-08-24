import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, computed, effect, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
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
            @if (session.can('audit_logs')) {
              <a routerLink="/audit-logs">Bitacora</a>
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
      transition: background var(--motion-fast) ease, color var(--motion-fast) ease, transform var(--motion-fast) ease;
    }
    nav a:hover {
      background: #1f2937;
      color: #fff;
      transform: translateX(2px);
    }
    .content {
      animation: surface-in var(--motion-slow) var(--ease-out) both;
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
const tokenRefreshIntervalMs = 60 * 60 * 1000;

export class AppComponent implements OnDestroy {
  private readonly currentUrl = signal('');
  private tokenRefreshTimer?: ReturnType<typeof setInterval>;

  readonly title = computed(() => {
    if (!this.session.user()) {
      return 'Acceso al sistema';
    }

    return this.sectionHeader().title;
  });

  readonly subtitle = computed(() => {
    if (!this.session.user()) {
      return 'Ingresa con tus credenciales';
    }

    return this.sectionHeader().subtitle;
  });

  constructor(
    readonly session: SessionService,
    private readonly api: ApiService,
    private readonly router: Router,
  ) {
    this.currentUrl.set(this.router.url);

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
      }
    });

    effect(() => {
      if (this.session.token()) {
        this.startTokenRefresh();
        return;
      }

      this.stopTokenRefresh();
    });
  }

  ngOnDestroy(): void {
    this.stopTokenRefresh();
  }

  logout(): void {
    this.api.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout(),
    });
  }

  private finishLogout(): void {
    this.stopTokenRefresh();
    this.session.clear();
    this.router.navigateByUrl('/login');
  }

  private startTokenRefresh(): void {
    if (this.tokenRefreshTimer) {
      return;
    }

    this.tokenRefreshTimer = setInterval(() => this.refreshToken(), tokenRefreshIntervalMs);
  }

  private stopTokenRefresh(): void {
    if (!this.tokenRefreshTimer) {
      return;
    }

    clearInterval(this.tokenRefreshTimer);
    this.tokenRefreshTimer = undefined;
  }

  private refreshToken(): void {
    if (!this.session.user()) {
      return;
    }

    this.api.refreshToken().subscribe({
      next: ({ token, user }) => this.session.save(token, user),
      error: (error: HttpErrorResponse) => {
        if ([401, 403].includes(error.status)) {
          this.finishLogout();
        }
      },
    });
  }

  private sectionHeader(): { title: string; subtitle: string } {
    const path = this.currentUrl().split('?')[0];

    if (path.startsWith('/users')) {
      return {
        title: 'Usuarios',
        subtitle: 'Gestion de usuarios, credenciales y perfiles asignados',
      };
    }

    if (path.startsWith('/profiles')) {
      return {
        title: 'Perfiles',
        subtitle: 'Gestion de permisos y secciones disponibles',
      };
    }

    if (path.startsWith('/audit-logs')) {
      return {
        title: 'Bitacora',
        subtitle: 'Comparacion de informacion anterior contra informacion actual',
      };
    }

    return {
      title: 'Productos',
      subtitle: 'Gestion del catalogo de productos',
    };
  }
}
