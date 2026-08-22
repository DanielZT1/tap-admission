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

    @if (selectedUser) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="user-detail-title">
        <article class="detail-card">
          <header>
            <div>
              <span>Detalle de usuario</span>
              <h2 id="user-detail-title">{{ selectedUser.name }}</h2>
            </div>
            <button class="btn secondary" type="button" (click)="selectedUser = undefined">Cerrar</button>
          </header>

          <dl>
            <div>
              <dt>Codigo</dt>
              <dd>{{ selectedUser.user_code }}</dd>
            </div>
            <div>
              <dt>Usuario</dt>
              <dd>{{ selectedUser.email }}</dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>{{ selectedUser.phone || 'Sin telefono' }}</dd>
            </div>
            <div>
              <dt>Foto de perfil</dt>
              <dd>{{ selectedUser.profile_photo_path || 'Sin foto registrada' }}</dd>
            </div>
          </dl>

          <section class="profile-section">
            <h3>Perfiles relacionados</h3>
            @if (selectedUser.profiles?.length) {
              <div class="chip-list">
                @for (profile of selectedUser.profiles ?? []; track profile.id) {
                  <span>{{ profile.name }}</span>
                }
              </div>
            } @else {
              <p>Sin perfiles relacionados.</p>
            }
          </section>
        </article>
      </div>
    }

    @if (userToDelete) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-user-title">
        <article class="confirm-card">
          <h2 id="delete-user-title">Se quiere eliminar un usuario</h2>
          <p>Esta accion eliminara <strong>{{ userToDelete.name }}</strong> y sus tokens de acceso.</p>
          <div class="actions">
            <button class="btn secondary" type="button" (click)="userToDelete = undefined">Cancelar</button>
            <button class="btn danger" type="button" (click)="confirmDelete()">Eliminar</button>
          </div>
        </article>
      </div>
    }
  `,
  styles: [`
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
      max-height: min(86vh, 760px);
      overflow: auto;
      padding: 20px;
      width: min(100%, 620px);
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
    .profile-section {
      border-top: 1px solid #e5e7eb;
      margin-top: 16px;
      padding-top: 14px;
    }
    .profile-section h3 {
      font-size: 14px;
      margin: 0 0 10px;
    }
    .profile-section p {
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
    @media (max-width: 620px) {
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
export class UsersComponent implements OnInit {
  users: AppUser[] = [];
  profiles: Profile[] = [];
  editingId = '';
  profileId = '';
  photo?: File;
  photoName = '';
  isDraggingPhoto = false;
  formErrors: string[] = [];
  selectedUser?: AppUser;
  userToDelete?: AppUser;
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
      this.selectedUser = detail;
    });
  }

  remove(user: AppUser): void {
    this.userToDelete = user;
  }

  confirmDelete(): void {
    if (!this.userToDelete) {
      return;
    }

    this.api.deleteUser(this.userToDelete.id).subscribe(() => {
      this.userToDelete = undefined;
      this.load();
    });
  }

  reset(): void {
    this.editingId = '';
    this.profileId = '';
    this.photo = undefined;
    this.photoName = '';
    this.isDraggingPhoto = false;
    this.formErrors = [];
    this.selectedUser = undefined;
    this.userToDelete = undefined;
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
