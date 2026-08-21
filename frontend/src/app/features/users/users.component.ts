import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AppUser, Profile } from '../../core/api.models';
import { SessionService } from '../../core/session.service';
import { saveBlob } from '../../shared/download';

@Component({
  selector: 'tap-users',
  imports: [FormsModule],
  template: `
    <section class="panel">
      @if (formErrors.length) {
        <div class="alert-card" role="alert">
          <strong>No se pudo dar de alta el usuario</strong>
          <span>Revisa los siguientes puntos antes de continuar.</span>
          <ul>
            @for (error of formErrors; track error) {
              <li>{{ error }}</li>
            }
          </ul>
        </div>
      }

      <form class="grid-form" (ngSubmit)="save()">
        <div class="field">
          <label for="name">Nombre</label>
          <input id="name" name="name" maxlength="120" required [(ngModel)]="form.name">
        </div>
        <div class="field">
          <label for="email">Usuario</label>
          <input id="email" name="email" type="email" maxlength="160" required [(ngModel)]="form.email">
        </div>
        <div class="field">
          <label for="phone">Telefono</label>
          <input id="phone" name="phone" placeholder="+523141234567" [(ngModel)]="form.phone">
        </div>
        <div class="field">
          <label for="password">Contrasena</label>
          <input id="password" name="password" type="password" [(ngModel)]="form.password">
        </div>
        <div class="field">
          <label for="photo">Foto de perfil</label>
          <label
            class="dropzone"
            [class.active]="isDraggingPhoto"
            for="photo"
            (dragover)="onPhotoDragOver($event)"
            (dragleave)="onPhotoDragLeave($event)"
            (drop)="onPhotoDrop($event)"
          >
            <strong>{{ photoName || 'Arrastra una imagen aqui' }}</strong>
            <span>JPG, PNG o WEBP. Maximo 2 MB.</span>
          </label>
          <input
            class="visually-hidden-input"
            id="photo"
            name="photo"
            type="file"
            accept="image/*"
            (change)="selectPhoto($event)"
          >
        </div>
        <div class="field">
          <label for="profile">Perfil</label>
          <select id="profile" name="profile" required [(ngModel)]="profileId">
            <option value="">Seleccionar</option>
            @for (profile of profiles; track profile.id) {
              <option [value]="profile.id">{{ profile.name }}</option>
            }
          </select>
        </div>
        <div class="form-actions submit">
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
              <th>Usuario</th>
              <th>Nombre</th>
              <th>Fecha de creacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users; track user.id) {
              <tr>
                <td>{{ user.user_code }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.created_at }}</td>
                <td>
                  <div class="actions">
                    <button class="btn secondary" type="button" (click)="edit(user)">Editar</button>
                    <button class="btn danger" type="button" (click)="remove(user)">Eliminar</button>
                    <button class="btn ghost" type="button" (click)="detail(user)">Detalle</button>
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
    .submit {
      align-items: end;
    }
    .list {
      margin-top: 16px;
    }
  `],
})
export class UsersComponent implements OnInit {
  users: AppUser[] = [];
  profiles: Profile[] = [];
  editingId = '';
  profileId = '';
  photo?: File;
  photoName = '';
  isDraggingPhoto = false;
  formErrors: string[] = [];
  form: { name: string; email: string; phone: string; password: string } = {
    name: '',
    email: '',
    phone: '',
    password: '',
  };

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
    this.api.users().subscribe((users) => this.users = users);
    this.api.profiles().subscribe((profiles) => this.profiles = profiles);
  }

  selectPhoto(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.setPhoto(input.files?.[0]);
  }

  save(): void {
    this.formErrors = this.validateForm();

    if (this.formErrors.length) {
      return;
    }

    const payload = new FormData();
    payload.set('name', this.form.name);
    payload.set('email', this.form.email);
    payload.set('phone', this.form.phone);
    payload.set('profile_ids[0]', this.profileId);
    if (this.form.password) {
      payload.set('password', this.form.password);
    }
    if (this.photo) {
      payload.set('profile_photo', this.photo);
    }

    this.api.saveUser(payload, this.editingId || undefined).subscribe({
      next: () => {
        this.reset();
        this.load();
      },
      error: (error) => {
        this.formErrors = this.extractErrors(error);
      },
    });
  }

  edit(user: AppUser): void {
    this.api.user(user.id).subscribe((detail) => {
      this.editingId = detail.id;
      this.form = {
        name: detail.name,
        email: detail.email,
        phone: detail.phone ?? '',
        password: '',
      };
      this.profileId = detail.profiles?.[0]?.id ?? '';
      this.photoName = detail.profile_photo_path ? 'Foto actual cargada' : '';
      this.formErrors = [];
    });
  }

  detail(user: AppUser): void {
    this.api.user(user.id).subscribe((detail) => {
      const profiles = detail.profiles?.map((profile) => profile.name).join(', ') || 'Sin perfiles';
      alert(`${detail.user_code}\n${detail.email}\n${detail.name}\nTelefono: ${detail.phone ?? 'N/A'}\nPerfiles: ${profiles}`);
    });
  }

  remove(user: AppUser): void {
    if (confirm(`Eliminar ${user.name}?`)) {
      this.api.deleteUser(user.id).subscribe(() => this.load());
    }
  }

  reset(): void {
    this.editingId = '';
    this.profileId = '';
    this.photo = undefined;
    this.photoName = '';
    this.isDraggingPhoto = false;
    this.formErrors = [];
    this.form = { name: '', email: '', phone: '', password: '' };
  }

  download(type: 'pdf' | 'excel'): void {
    this.api.download('users', type).subscribe((blob) => saveBlob(blob, `usuarios.${type === 'pdf' ? 'pdf' : 'xlsx'}`));
  }

  onPhotoDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingPhoto = true;
  }

  onPhotoDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingPhoto = false;
  }

  onPhotoDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDraggingPhoto = false;
    this.setPhoto(event.dataTransfer?.files?.[0]);
  }

  private setPhoto(file?: File): void {
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.formErrors = ['La foto de perfil debe ser una imagen.'];
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      this.formErrors = ['La foto de perfil no debe superar 2 MB.'];
      return;
    }

    this.photo = file;
    this.photoName = file.name;
    this.formErrors = [];
  }

  private validateForm(): string[] {
    const errors: string[] = [];

    if (!this.form.name.trim()) {
      errors.push('El nombre del usuario es obligatorio.');
    }

    if (!this.form.email.trim()) {
      errors.push('El correo de usuario es obligatorio.');
    }

    if (!this.profileId) {
      errors.push('Debes seleccionar un perfil.');
    }

    if (!this.editingId && !this.photo) {
      errors.push('La foto de perfil es obligatoria.');
    }

    if (this.form.phone && !/^\+[1-9]\d{7,14}$/.test(this.form.phone)) {
      errors.push('El telefono debe incluir codigo de pais, por ejemplo +523141234567.');
    }

    return errors;
  }

  private extractErrors(error: unknown): string[] {
    const response = error as { error?: { errors?: Record<string, string[]>; message?: string } };
    const errors = response.error?.errors;

    if (errors) {
      return Object.values(errors).flat();
    }

    return [response.error?.message ?? 'No se pudo guardar el usuario.'];
  }
}
