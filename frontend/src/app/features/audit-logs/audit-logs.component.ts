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

const fieldLabels: Record<string, string> = {
  brand: 'marca',
  email: 'correo',
  name: 'nombre',
  phone: 'telefono',
  price: 'precio',
  product_code: 'codigo de producto',
  profile_code: 'codigo de perfil',
  profile_ids: 'perfiles asignados',
  profile_photo_path: 'foto de perfil',
  section_keys: 'secciones permitidas',
  user_code: 'codigo de usuario',
};

const sectionLabels: Record<string, string> = {
  audit_logs: 'Bitacora',
  products: 'Productos',
  profiles: 'Perfiles',
  users: 'Usuarios',
};

const ignoredFields = new Set(['created_at', 'updated_at', 'id', '_id']);

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
                  <button class="btn ghost" type="button" (click)="selectedLog = log">Detalle</button>
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

          <section class="summary-card">
            <h3>Movimiento</h3>
            <ul>
              @for (change of describeChanges(selectedLog); track change) {
                <li>{{ change }}</li>
              }
            </ul>
          </section>
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
    .summary-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      min-width: 0;
      overflow: hidden;
    }
    .summary-card h3 {
      background: #f8fafc;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
      margin: 0;
      padding: 10px 12px;
    }
    .summary-card ul {
      display: grid;
      gap: 10px;
      list-style: none;
      margin: 0;
      padding: 14px;
    }
    .summary-card li {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      color: #0f172a;
      line-height: 1.5;
      padding: 12px;
    }
    .summary-card li::before {
      color: #2563eb;
      content: 'Cambio';
      display: block;
      font-size: 11px;
      font-weight: 900;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    @media (max-width: 820px) {
      .section-head,
      .audit-card header {
        align-items: stretch;
        flex-direction: column;
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

  describeChanges(log: AuditLog): string[] {
    if (log.action === 'created') {
      return this.describeCreated(log);
    }

    if (log.action === 'deleted') {
      return this.describeDeleted(log);
    }

    return this.describeUpdated(log);
  }

  private describeCreated(log: AuditLog): string[] {
    const name = this.entityName(log.current);

    return [`Se registro ${this.entityArticle(log.entity)} ${this.entityLabel(log.entity).toLowerCase()} "${name}".`];
  }

  private describeDeleted(log: AuditLog): string[] {
    const name = this.entityName(log.previous);

    return [`Se elimino ${this.entityArticle(log.entity)} ${this.entityLabel(log.entity).toLowerCase()} "${name}".`];
  }

  private describeUpdated(log: AuditLog): string[] {
    const previous = log.previous ?? {};
    const current = log.current ?? {};
    const fields = Array.from(new Set([...Object.keys(previous), ...Object.keys(current)]))
      .filter((field) => !ignoredFields.has(field))
      .filter((field) => this.normalizeValue(previous[field]) !== this.normalizeValue(current[field]));

    if (!fields.length) {
      return ['No se detectaron cambios visibles para el usuario.'];
    }

    return fields.map((field) => {
      const previousValue = this.humanValue(field, previous[field]);
      const currentValue = this.humanValue(field, current[field]);

      return `El campo ${this.fieldLabel(field)} cambio de ${previousValue} a ${currentValue}.`;
    });
  }

  private entityName(value: Record<string, unknown> | null): string {
    return String(value?.['name'] ?? value?.['email'] ?? value?.['product_code'] ?? value?.['profile_code'] ?? 'sin nombre');
  }

  private entityArticle(entity: string): string {
    return entity === 'profile' ? 'el' : 'el';
  }

  private fieldLabel(field: string): string {
    return fieldLabels[field] ?? field.replaceAll('_', ' ');
  }

  private humanValue(field: string, value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return 'sin valor';
    }

    if (Array.isArray(value)) {
      if (!value.length) {
        return 'sin elementos';
      }

      return value.map((item) => this.humanArrayItem(field, item)).join(', ');
    }

    if (field === 'price') {
      return `$${value}`;
    }

    if (typeof value === 'object') {
      return 'informacion relacionada';
    }

    return `"${String(value)}"`;
  }

  private humanArrayItem(field: string, value: unknown): string {
    if (field === 'section_keys') {
      return sectionLabels[String(value)] ?? String(value);
    }

    return String(value);
  }

  private normalizeValue(value: unknown): string {
    return JSON.stringify(value ?? null);
  }
}
