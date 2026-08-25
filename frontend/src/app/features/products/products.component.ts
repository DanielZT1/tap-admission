import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, Subject, catchError, exhaustMap, finalize, tap } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { Product } from '../../core/api.models';
import { SessionService } from '../../core/session.service';
import { saveBlob } from '../../shared/download';

@Component({
  selector: 'tap-products',
  imports: [CurrencyPipe, FormsModule],
  template: `
    <section class="panel list">
      <div class="datatable-toolbar">
        <div>
          <h2>Productos registrados</h2>
          <span>{{ products.length }} producto{{ products.length === 1 ? '' : 's' }} en el catalogo</span>
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
              <th>Precio</th>
              <th>Fecha de creacion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (product of products; track product.id) {
              <tr>
                <td>{{ product.product_code }}</td>
                <td>{{ product.name }}</td>
                <td>{{ product.price | currency: 'MXN' : 'symbol' : '1.2-2' }}</td>
                <td>{{ product.created_at }}</td>
                <td>
                  <div class="actions">
                    <button class="btn secondary" type="button" (click)="edit(product)">Editar</button>
                    <button class="btn danger" type="button" (click)="remove(product)">Eliminar</button>
                    <button class="btn ghost" type="button" (click)="view(product)">Ver</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </section>

    @if (isFormOpen) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="product-form-title">
        <article class="form-modal">
          <header>
            <div>
              <span>{{ editingId ? 'Edicion' : 'Alta' }}</span>
              <h2 id="product-form-title">{{ editingId ? 'Editar producto' : 'Nuevo producto' }}</h2>
            </div>
            <button class="btn secondary" type="button" (click)="closeForm()">Cerrar</button>
          </header>

          @if (formErrors.length) {
            <div class="alert-card" role="alert">
              <strong>No se pudo dar de alta el producto</strong>
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
              <input id="name" name="name" maxlength="120" required placeholder="Ej. Botas de seguridad" [(ngModel)]="form.name">
            </div>
            <div class="field">
              <label for="brand">Marca</label>
              <input id="brand" name="brand" maxlength="120" required placeholder="Ej. Industrial Pro" [(ngModel)]="form.brand">
            </div>
            <div class="field">
              <label for="price">Precio</label>
              <div class="input-prefix">
                <span>$</span>
                <input
                  id="price"
                  name="price"
                  inputmode="numeric"
                  maxlength="3"
                  placeholder="Ej. 245"
                  required
                  [ngModel]="priceInput"
                  (keydown)="allowDigitsOnly($event)"
                  (paste)="pastePrice($event)"
                  (ngModelChange)="setPrice($event)"
                >
              </div>
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

    @if (productToDelete) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <article class="confirm-card">
          <h2 id="delete-title">Se quiere eliminar un producto</h2>
          <p>Esta accion eliminara <strong>{{ productToDelete.name }}</strong> del catalogo.</p>
          <div class="actions">
            <button class="btn secondary" type="button" (click)="productToDelete = undefined">Cancelar</button>
            <button class="btn danger" type="button" [disabled]="isDeleting" (click)="confirmDelete()">
              {{ isDeleting ? 'Eliminando...' : 'Eliminar' }}
            </button>
          </div>
        </article>
      </div>
    }

    @if (productToView) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
        <article class="detail-card">
          <header>
            <div>
              <span>Detalle del producto</span>
              <h2 id="product-detail-title">{{ productToView.name }}</h2>
            </div>
            <button class="btn secondary" type="button" (click)="productToView = undefined">Cerrar</button>
          </header>

          <dl>
            <div>
              <dt>Codigo</dt>
              <dd>{{ productToView.product_code }}</dd>
            </div>
            <div>
              <dt>Marca</dt>
              <dd>{{ productToView.brand }}</dd>
            </div>
            <div>
              <dt>Precio</dt>
              <dd>{{ productToView.price | currency: 'MXN' : 'symbol' : '1.2-2' }}</dd>
            </div>
            <div>
              <dt>Fecha de creacion</dt>
              <dd>{{ productToView.created_at }}</dd>
            </div>
          </dl>
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
      padding: 20px;
      width: min(100%, 520px);
    }
    .detail-card header {
      align-items: flex-start;
      display: flex;
      gap: 14px;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .detail-card span {
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
export class ProductsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly saveRequests = new Subject<void>();
  private readonly deleteRequests = new Subject<Product>();

  products: Product[] = [];
  editingId = '';
  form: Partial<Product> = { name: '', brand: '', price: 0 };
  formErrors: string[] = [];
  priceInput = '';
  productToDelete?: Product;
  productToView?: Product;
  isFormOpen = false;
  isSaving = false;
  isDeleting = false;

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly session: SessionService,
  ) {
    this.saveRequests.pipe(
      exhaustMap(() => {
        const productId = this.editingId || undefined;
        const payload = { ...this.form };
        this.isSaving = true;

        return this.api.saveProduct(payload, productId).pipe(
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
      exhaustMap((product) => {
        this.isDeleting = true;

        return this.api.deleteProduct(product.id).pipe(
          tap(() => {
            this.productToDelete = undefined;
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
    this.api.products().subscribe((products) => this.products = products);
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

  edit(product: Product): void {
    this.editingId = product.id;
    this.form = { name: product.name, brand: product.brand, price: product.price };
    this.priceInput = String(product.price);
    this.formErrors = [];
    this.isFormOpen = true;
  }

  view(product: Product): void {
    this.productToView = product;
  }

  remove(product: Product): void {
    this.productToDelete = product;
  }

  confirmDelete(): void {
    if (!this.productToDelete) {
      return;
    }

    this.deleteRequests.next(this.productToDelete);
  }

  clearForm(): void {
    this.editingId = '';
    this.form = { name: '', brand: '', price: 0 };
    this.priceInput = '';
    this.formErrors = [];
  }

  closeForm(): void {
    this.isFormOpen = false;
    this.clearForm();
  }

  reset(): void {
    this.closeForm();
    this.productToView = undefined;
  }

  download(type: 'pdf' | 'excel'): void {
    this.api.download('products', type).subscribe((blob) => saveBlob(blob, `productos.${type === 'pdf' ? 'pdf' : 'xlsx'}`));
  }

  allowDigitsOnly(event: KeyboardEvent): void {
    if (this.isEditingShortcut(event) || /^\d$/.test(event.key)) {
      return;
    }

    event.preventDefault();
  }

  pastePrice(event: ClipboardEvent): void {
    event.preventDefault();
    this.setPrice(event.clipboardData?.getData('text') ?? '');
  }

  setPrice(value: string): void {
    this.priceInput = value.replace(/\D/g, '').slice(0, 3);
    this.form.price = this.priceInput ? Number(this.priceInput) : undefined;
  }

  private validateForm(): string[] {
    const errors: string[] = [];

    if (!this.form.name?.trim()) {
      errors.push('El nombre del producto es obligatorio.');
    }

    if (!this.form.brand?.trim()) {
      errors.push('La marca del producto es obligatoria.');
    }

    if (this.form.price === undefined || this.priceInput === '') {
      errors.push('El precio del producto es obligatorio.');
    } else if (this.form.price > 999) {
      errors.push('El precio debe tener maximo 3 digitos.');
    }

    return errors;
  }

  private extractErrors(error: unknown): string[] {
    const response = error as { error?: { errors?: Record<string, string[]>; message?: string } };
    const errors = response.error?.errors;

    if (errors) {
      return Object.values(errors).flat();
    }

    return [response.error?.message ?? 'No se pudo guardar el producto.'];
  }

  private isEditingShortcut(event: KeyboardEvent): boolean {
    const allowedKeys = new Set(['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);

    return allowedKeys.has(event.key) || event.ctrlKey || event.metaKey;
  }
}
