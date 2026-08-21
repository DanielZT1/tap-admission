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
  `],
})
export class ProfilesComponent implements OnInit {
  readonly sections = sections;
  profiles: Profile[] = [];
  editingId = '';
  name = '';
  selected = new Set<string>(['products']);

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
      alert(`${detail.profile_code}\n${detail.name}\nSecciones: ${(detail.section_keys ?? []).join(', ')}`);
    });
  }

  remove(profile: Profile): void {
    if (confirm(`Eliminar ${profile.name}?`)) {
      this.api.deleteProfile(profile.id).subscribe(() => this.load());
    }
  }

  reset(): void {
    this.editingId = '';
    this.name = '';
    this.selected = new Set<string>(['products']);
  }

  download(type: 'pdf' | 'excel'): void {
    this.api.download('profiles', type).subscribe((blob) => saveBlob(blob, `perfiles.${type === 'pdf' ? 'pdf' : 'xlsx'}`));
  }
}
