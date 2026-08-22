import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuditLog } from '../../core/api.models';
import { SessionService } from '../../core/session.service';

const entityLabels: Record<string, string> = {
  product: 'Producto',
  user: 'Usuario',
  profile: 'Perfil',
};

const actionLabels: Record<string, string> = {
  created: 'Alta',
  updated: 'Edicion',
  deleted: 'Eliminacion',
};

@Component({
  selector: 'tap-audit-logs',
  imports: [CommonModule],
  template: `
    <section class="panel">
      <div class="section-head">
        <div>
          <h2>Bitacora de cambios</h2>
          <p>Comparacion entre la informacion anterior y la informacion actual.</p>
        </div>
        <button class="btn secondary" type="button" (click)="load()">Actualizar</button>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Entidad</th>
              <th>Accion</th>
              <th>Codigo actor</th>
              <th>ID entidad</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            @for (log of auditLogs; track log.id) {
              <tr>
                <td>{{ log.created_at }}</td>
                <td>{{ entityLabel(log.entity) }}</td>
                <td><span class="status">{{ actionLabel(log.action) }}</span></td>
                <td>{{ log.actor_user_code || 'Sistema' }}</td>
                <td class="mono">{{ log.entity_id }}</td>
                <td>
                  <button class="btn ghost" type="button" (click)="selectedLog = log">Comparar</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6">No hay registros de bitacora todavia.</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    @if (selectedLog) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="audit-title">
        <article class="audit-card">
          <header>
            <div>
              <h2 id="audit-title">{{ entityLabel(selectedLog.entity) }} - {{ actionLabel(selectedLog.action) }}</h2>
              <p>{{ selectedLog.created_at }} · {{ selectedLog.actor_user_code || 'Sistema' }}</p>
            </div>
            <button class="btn secondary" type="button" (click)="selectedLog = undefined">Cerrar</button>
          </header>

          <div class="compare-grid">
            <section>
              <h3>Informacion anterior</h3>
              <pre>{{ formatJson(selectedLog.previous) }}</pre>
            </section>
            <section>
              <h3>Informacion actual</h3>
              <pre>{{ formatJson(selectedLog.current) }}</pre>
            </section>
          </div>
        </article>
      </div>
    }
  `,
  styles: [`
    .section-head {
      align-items: center;
      display: flex;
      gap: 16px;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .section-head h2 {
      font-size: 18px;
      margin: 0;
    }
    .section-head p {
      color: #64748b;
      margin: 4px 0 0;
    }
    .status {
      background: #eef2ff;
      border-radius: 999px;
      color: #3730a3;
      display: inline-flex;
      font-size: 12px;
      font-weight: 800;
      padding: 4px 8px;
      transition: background var(--motion-fast) ease, transform var(--motion-fast) ease;
    }
    tr:hover .status {
      background: #e0e7ff;
      transform: translateY(-1px);
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      max-width: 240px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .audit-card {
      animation: modal-in var(--motion-base) var(--ease-out) both;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
      max-height: min(86vh, 760px);
      overflow: auto;
      padding: 20px;
      width: min(100%, 980px);
    }
    .audit-card header {
      align-items: flex-start;
      display: flex;
      gap: 12px;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .audit-card h2 {
      font-size: 19px;
      margin: 0;
    }
    .audit-card p {
      color: #64748b;
      margin: 4px 0 0;
    }
    .compare-grid {
      display: grid;
      gap: 14px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .compare-grid section {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      min-width: 0;
      overflow: hidden;
    }
    .compare-grid h3 {
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      margin: 0;
      padding: 10px 12px;
    }
    pre {
      color: #0f172a;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 12px;
      line-height: 1.45;
      margin: 0;
      max-height: 420px;
      overflow: auto;
      padding: 12px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    @media (max-width: 820px) {
      .section-head,
      .audit-card header {
        align-items: stretch;
        flex-direction: column;
      }
      .compare-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class AuditLogsComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  selectedLog?: AuditLog;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly session: SessionService,
  ) {}

  ngOnInit(): void {
    if (!this.session.user()) {
      this.router.navigateByUrl('/login');
      return;
    }

    if (!this.session.can('audit_logs')) {
      this.router.navigateByUrl('/products');
      return;
    }

    this.load();
  }

  load(): void {
    this.api.auditLogs().subscribe((auditLogs) => this.auditLogs = auditLogs);
  }

  entityLabel(entity: string): string {
    return entityLabels[entity] ?? entity;
  }

  actionLabel(action: string): string {
    return actionLabels[action] ?? action;
  }

  formatJson(value: Record<string, unknown> | null): string {
    return value ? JSON.stringify(value, null, 2) : 'Sin informacion';
  }
}
