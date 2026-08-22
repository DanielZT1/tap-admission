import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Profile } from '../../core/api.models';
import { SessionService } from '../../core/session.service';
import { saveBlob } from '../../shared/download';

const sections = [
  { key: 'products', label: 'Productos' },
  { key: 'users', label: 'Usuarios' },
  { key: 'profiles', label: 'Perfiles' },
  { key: 'audit_logs', label: 'Bitacora' },
];

@Component({
  selector: 'tap-profiles',
  imports: [FormsModule],
  template: `
    <section class="panel">
      <form class="grid-form" (ngSubmit)="save()">
        <div class="field">
          <label for="name">Nombre</label>
          <input id="name" name="name" required [(ngModel)]="name">
        </div>
        <fieldset>
          <legend>Secciones</legend>
          @for (section of sections; track section.key) {
            <label class="check">
              <input type="checkbox" [checked]="selected.has(section.key)" (change)="toggle(section.key)">
              <span>{{ section.label }}</span>
            </label>
          }
        </fieldset>
        <div class="actions submit">
          <button class="btn primary" type="submit">{{ editingId ? 'Actualizar' : 'Guardar' }}</button>
          <button class="btn secondary" type="button" (click)="reset()">Limpiar</button>
          <button class="btn secondary" type="button" (click)="download('pdf')">PDF</button>
          <button class="btn secondary" type="button" (click)="download('excel')">Excel</button>
        </div>
      </form>
    </section>

    <section class="panel list">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Fecha de creacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (profile of profiles; track profile.id) {
              <tr>
                <td>{{ profile.profile_code }}</td>
                <td>{{ profile.name }}</td>
                <td>{{ profile.created_at }}</td>
                <td>
                  <div class="actions">
                    <button class="btn secondary" type="button" (click)="edit(profile)">Editar</button>
                    <button class="btn danger" type="button" (click)="remove(profile)">Eliminar</button>
                    <button class="btn ghost" type="button" (click)="detail(profile)">Detalle</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    @if (profileToView) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-detail-title">
        <article class="detail-card">
          <header>
            <div>
              <span>Detalle del perfil</span>
              <h2 id="profile-detail-title">{{ profileToView.name }}</h2>
            </div>
            <button class="btn secondary" type="button" (click)="profileToView = undefined">Cerrar</button>
          </header>

          <dl>
            <div>
              <dt>Codigo</dt>
              <dd>{{ profileToView.profile_code }}</dd>
            </div>
            <div>
              <dt>Nombre</dt>
              <dd>{{ profileToView.name }}</dd>
            </div>
            <div>
              <dt>Fecha de creacion</dt>
              <dd>{{ profileToView.created_at }}</dd>
            </div>
          </dl>

          <section class="section-list">
            <h3>Secciones relacionadas</h3>
            @if (profileToView.section_keys?.length) {
              <div class="chip-list">
                @for (section of profileToView.section_keys ?? []; track section) {
                  <span>{{ sectionLabel(section) }}</span>
                }
              </div>
            } @else {
              <p>Sin secciones relacionadas.</p>
            }
          </section>
        </article>
      </div>
    }

    @if (profileToDelete) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-profile-title">
        <article class="confirm-card">
          <h2 id="delete-profile-title">Se quiere eliminar un perfil</h2>
          <p>Esta accion eliminara <strong>{{ profileToDelete.name }}</strong> del catalogo de perfiles.</p>
          <div class="actions">
            <button class="btn secondary" type="button" (click)="profileToDelete = undefined">Cancelar</button>
            <button class="btn danger" type="button" (click)="confirmDelete()">Eliminar</button>
          </div>
        </article>
      </div>
    }
  `,
  styles: [`
    fieldset {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 0;
      min-height: 40px;
      padding: 8px 10px;
    }
    legend {
      color: #4b5563;
      font-size: 13px;
      font-weight: 650;
      padding: 0 4px;
    }
    .check {
      align-items: center;
      display: inline-flex;
      gap: 6px;
    }
    .submit {
      align-items: end;
    }
    .list {
      margin-top: 16px;
    }
    .detail-card {
      animation: modal-in var(--motion-base) var(--ease-out) both;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
      max-height: min(86vh, 720px);
      overflow: auto;
      padding: 20px;
      width: min(100%, 560px);
    }
    .detail-card header {
      align-items: flex-start;
      display: flex;
      gap: 14px;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .detail-card header span {
      color: #64748b;
      display: block;
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .detail-card h2 {
      color: #0f172a;
      font-size: 20px;
      margin: 0;
      overflow-wrap: anywhere;
    }
    .detail-card dl {
      display: grid;
      gap: 10px;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin: 0;
    }
    .detail-card dl div {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      transition: border-color var(--motion-fast) ease, transform var(--motion-fast) ease;
    }
    .detail-card dl div:hover {
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }
    .detail-card dt {
      color: #64748b;
      font-size: 12px;
      font-weight: 800;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    .detail-card dd {
      color: #0f172a;
      font-weight: 750;
      margin: 0;
      overflow-wrap: anywhere;
    }
    .section-list {
      border-top: 1px solid #e5e7eb;
      margin-top: 16px;
      padding-top: 14px;
    }
    .section-list h3 {
      font-size: 14px;
      margin: 0 0 10px;
    }
    .section-list p {
      color: #64748b;
      margin: 0;
    }
    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .chip-list span {
      background: #eef2ff;
      border-radius: 999px;
      color: #3730a3;
      font-size: 12px;
      font-weight: 800;
      padding: 6px 10px;
    }
    @media (max-width: 560px) {
      .detail-card header {
        align-items: stretch;
        flex-direction: column;
      }
      .detail-card dl {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class ProfilesComponent implements OnInit {
  readonly sections = sections;
  profiles: Profile[] = [];
  editingId = '';
  name = '';
  selected = new Set<string>(['products']);
  profileToView?: Profile;
  profileToDelete?: Profile;

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
    this.load();
  }

  load(): void {
    this.api.profiles().subscribe((profiles) => this.profiles = profiles);
  }

  toggle(section: string): void {
    this.selected.has(section) ? this.selected.delete(section) : this.selected.add(section);
  }

  save(): void {
    this.api.saveProfile({
      name: this.name,
      section_keys: [...this.selected],
    }, this.editingId || undefined).subscribe(() => {
      this.reset();
      this.load();
    });
  }

  edit(profile: Profile): void {
    this.api.profile(profile.id).subscribe((detail) => {
      this.editingId = detail.id;
      this.name = detail.name;
      this.selected = new Set(detail.section_keys ?? []);
    });
  }

  detail(profile: Profile): void {
    this.api.profile(profile.id).subscribe((detail) => {
      this.profileToView = detail;
    });
  }

  remove(profile: Profile): void {
    this.profileToDelete = profile;
  }

  confirmDelete(): void {
    if (!this.profileToDelete) {
      return;
    }

    this.api.deleteProfile(this.profileToDelete.id).subscribe(() => {
      this.profileToDelete = undefined;
      this.load();
    });
  }

  reset(): void {
    this.editingId = '';
    this.name = '';
    this.selected = new Set<string>(['products']);
    this.profileToView = undefined;
    this.profileToDelete = undefined;
  }

  download(type: 'pdf' | 'excel'): void {
    this.api.download('profiles', type).subscribe((blob) => saveBlob(blob, `perfiles.${type === 'pdf' ? 'pdf' : 'xlsx'}`));
  }

  sectionLabel(section: string): string {
    return sections.find((item) => item.key === section)?.label ?? section;
  }
}
