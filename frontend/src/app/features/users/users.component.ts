import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, Subject, catchError, exhaustMap, finalize, forkJoin, tap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AppUser, Profile } from '../../core/api.models';
import { SessionService } from '../../core/session.service';
import { saveBlob } from '../../shared/download';

@Component({
  selector: 'tap-users',
  imports: [FormsModule],
  template: `
    <section class="panel list">
      <div class="datatable-toolbar">
        <div>
          <h2>Usuarios registrados</h2>
          <span>{{ users.length }} usuario{{ users.length === 1 ? '' : 's' }} con acceso al sistema</span>
        </div>
        <div class="actions">
          <button class="btn primary" type="button" (click)="openCreate()">Nuevo</button>
          <button class="btn secondary" type="button" (click)="download('pdf')">PDF</button>
          <button class="btn secondary" type="button" (click)="download('excel')">Excel</button>
        </div>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Fecha de creacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users; track user.id) {
              <tr>
                <td>{{ user.user_code }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
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

    @if (isFormOpen) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="user-form-title">
        <article class="form-modal">
          <header>
            <div>
              <span>{{ editingId ? 'Edicion' : 'Alta' }}</span>
              <h2 id="user-form-title">{{ editingId ? 'Editar usuario' : 'Nuevo usuario' }}</h2>
            </div>
            <button class="btn secondary" type="button" (click)="closeForm()">Cerrar</button>
          </header>

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
              <input id="name" name="name" maxlength="120" required placeholder="Ej. Daniel Zamora" [(ngModel)]="form.name">
            </div>
            <div class="field">
              <label for="email">Correo</label>
              <input id="email" name="email" type="email" maxlength="160" required placeholder="Ej. usuario@correo.com" [(ngModel)]="form.email">
            </div>
            <div class="field">
              <label for="phone">Telefono</label>
              <div class="phone-field">
                <input
                  class="phone-prefix"
                  id="phone_prefix"
                  name="phone_prefix"
                  inputmode="tel"
                  maxlength="5"
                  placeholder="Ej. +52"
                  [ngModel]="selectedPhonePrefix"
                  (keydown)="allowPhonePrefixKey($event)"
                  (paste)="pastePhonePrefix($event)"
                  (ngModelChange)="setPhonePrefix($event)"
                >
                <input
                  id="phone"
                  name="phone"
                  inputmode="tel"
                  maxlength="15"
                  placeholder="Ej. 3141234567"
                  [ngModel]="phoneNumber"
                  (keydown)="allowDigitsOnly($event)"
                  (paste)="pastePhoneNumber($event)"
                  (ngModelChange)="setPhoneNumber($event)"
                >
              </div>
            </div>
            <div class="field">
              <label for="password">Contraseña</label>
              <input id="password" name="password" type="password" placeholder="Ej. Password123!" [(ngModel)]="form.password">
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
              <button class="btn primary" type="submit" [disabled]="isSaving">
                {{ isSaving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar') }}
              </button>
              <button class="btn secondary" type="button" (click)="clearForm()">Limpiar</button>
            </div>
          </form>
        </article>
      </div>
    }

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
              <dt>Correo</dt>
              <dd>{{ selectedUser.email }}</dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>{{ selectedUser.phone || 'Sin telefono' }}</dd>
            </div>
            <div>
              <dt>Foto de perfil</dt>
              <dd>
                @if (selectedUser.profile_photo_url) {
                  <img class="profile-photo-preview" [src]="selectedUser.profile_photo_url" alt="Foto de perfil de {{ selectedUser.name }}">
                } @else {
                  Sin foto registrada
                }
              </dd>
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
            <button class="btn danger" type="button" [disabled]="isDeleting" (click)="confirmDelete()">
              {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
            </button>
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
    .phone-field {
      display: grid;
      gap: 8px;
      grid-template-columns: minmax(72px, 82px) minmax(0, 1fr);
      min-width: 0;
    }
    .phone-field select,
    .phone-field input {
      min-width: 0;
    }
    .phone-prefix {
      text-align: center;
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
    .profile-photo-preview {
      aspect-ratio: 1;
      border: 2px solid #e5e7eb;
      border-radius: 50%;
      display: block;
      max-width: 92px;
      object-fit: cover;
      width: 100%;
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
      .phone-field {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class UsersComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly saveRequests = new Subject<void>();
  private readonly deleteRequests = new Subject<AppUser>();
  private readonly knownPhonePrefixes = ['+52', '+57', '+51', '+54', '+55', '+56', '+34', '+1'];

  users: AppUser[] = [];
  profiles: Profile[] = [];
  editingId = '';
  profileId = '';
  selectedPhonePrefix = '+52';
  phoneNumber = '';
  photo?: File;
  photoName = '';
  isDraggingPhoto = false;
  formErrors: string[] = [];
  selectedUser?: AppUser;
  userToDelete?: AppUser;
  isFormOpen = false;
  isSaving = false;
  isDeleting = false;
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
  ) {
    this.saveRequests.pipe(
      exhaustMap(() => {
        const userId = this.editingId || undefined;
        const payload = this.buildPayload();
        this.isSaving = true;

        return this.api.saveUser(payload, userId).pipe(
          tap(() => {
            this.closeForm();
            this.load();
          }),
          catchError((error) => {
            this.formErrors = this.extractErrors(error);
            return EMPTY;
          }),
          finalize(() => this.isSaving = false),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.deleteRequests.pipe(
      exhaustMap((user) => {
        this.isDeleting = true;

        return this.api.deleteUser(user.id).pipe(
          tap(() => {
            this.userToDelete = undefined;
            this.load();
          }),
          catchError(() => EMPTY),
          finalize(() => this.isDeleting = false),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  ngOnInit(): void {
    if (!this.session.user()) {
      this.router.navigateByUrl('/login');
      return;
    }
    this.load();
  }

  load(): void {
    forkJoin({
      users: this.api.users(),
      profiles: this.api.profiles(),
    }).subscribe(({ users, profiles }) => {
      this.users = users;
      this.profiles = profiles;
    });
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

    this.saveRequests.next();
  }

  openCreate(): void {
    this.clearForm();
    this.isFormOpen = true;
  }

  edit(user: AppUser): void {
    this.api.user(user.id).subscribe((detail) => {
      this.editingId = detail.id;
      this.form = {
        name: detail.name,
        email: detail.email,
        phone: '',
        password: '',
      };
      this.setPhoneFromStoredValue(detail.phone);
      this.profileId = detail.profiles?.[0]?.id ?? '';
      this.photoName = detail.profile_photo_path ? 'Foto actual cargada' : '';
      this.formErrors = [];
      this.isFormOpen = true;
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

    this.deleteRequests.next(this.userToDelete);
  }

  clearForm(): void {
    this.editingId = '';
    this.profileId = '';
    this.selectedPhonePrefix = '+52';
    this.phoneNumber = '';
    this.photo = undefined;
    this.photoName = '';
    this.isDraggingPhoto = false;
    this.formErrors = [];
    this.form = { name: '', email: '', phone: '', password: '' };
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.clearForm();
  }

  reset(): void {
    this.closeForm();
    this.selectedUser = undefined;
    this.userToDelete = undefined;
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
      errors.push('El correo es obligatorio.');
    }

    if (!this.profileId) {
      errors.push('Debes seleccionar un perfil.');
    }

    if (!this.editingId && !this.photo) {
      errors.push('La foto de perfil es obligatoria.');
    }

    const phone = this.fullPhone();

    if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      errors.push('El telefono debe incluir prefijo y entre 8 y 15 digitos.');
    }

    return errors;
  }

  allowDigitsOnly(event: KeyboardEvent): void {
    if (this.isEditingShortcut(event) || /^\d$/.test(event.key)) {
      return;
    }

    event.preventDefault();
  }

  allowPhonePrefixKey(event: KeyboardEvent): void {
    if (this.isEditingShortcut(event) || /^\d$/.test(event.key)) {
      return;
    }

    const input = event.target as HTMLInputElement;
    const cursorAtStart = input.selectionStart === 0;
    const plusIsMissing = !input.value.includes('+');

    if (event.key === '+' && cursorAtStart && plusIsMissing) {
      return;
    }

    event.preventDefault();
  }

  pastePhoneNumber(event: ClipboardEvent): void {
    event.preventDefault();
    this.setPhoneNumber(event.clipboardData?.getData('text') ?? '');
  }

  pastePhonePrefix(event: ClipboardEvent): void {
    event.preventDefault();
    this.setPhonePrefix(event.clipboardData?.getData('text') ?? '');
  }

  setPhoneNumber(value: string): void {
    this.phoneNumber = value.replace(/\D/g, '').slice(0, 15);
    this.form.phone = this.fullPhone();
  }

  setPhonePrefix(value: string): void {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    this.selectedPhonePrefix = digits ? `+${digits}` : '+';
    this.form.phone = this.fullPhone();
  }

  private buildPayload(): FormData {
    const payload = new FormData();
    payload.set('name', this.form.name);
    payload.set('email', this.form.email);
    payload.set('phone', this.fullPhone());
    payload.set('profile_ids[0]', this.profileId);
    if (this.form.password) {
      payload.set('password', this.form.password);
    }
    if (this.photo) {
      payload.set('profile_photo', this.photo);
    }

    return payload;
  }

  private fullPhone(): string {
    return this.phoneNumber ? `${this.selectedPhonePrefix}${this.phoneNumber}` : '';
  }

  private setPhoneFromStoredValue(phone?: string): void {
    const cleanPhone = phone?.trim() ?? '';
    const matchingPrefix = this.knownPhonePrefixes.find((prefix) => cleanPhone.startsWith(prefix));

    this.selectedPhonePrefix = matchingPrefix ?? '+52';
    this.phoneNumber = matchingPrefix
      ? cleanPhone.slice(matchingPrefix.length).replace(/\D/g, '')
      : cleanPhone.replace(/\D/g, '');
    this.form.phone = this.fullPhone();
  }

  private extractErrors(error: unknown): string[] {
    const response = error as { error?: { errors?: Record<string, string[]>; message?: string } };
    const errors = response.error?.errors;

    if (errors) {
      return Object.values(errors).flat();
    }

    return [response.error?.message ?? 'No se pudo guardar el usuario.'];
  }

  private isEditingShortcut(event: KeyboardEvent): boolean {
    const allowedKeys = new Set(['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);

    return allowedKeys.has(event.key) || event.ctrlKey || event.metaKey;
  }
}
