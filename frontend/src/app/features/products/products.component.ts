import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Product } from '../../core/api.models';
import { SessionService } from '../../core/session.service';
import { saveBlob } from '../../shared/download';

@Component({
  selector: 'tap-products',
  imports: [FormsModule],
  template: `
    <section class="panel">
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
          <input id="name" name="name" maxlength="120" required [(ngModel)]="form.name">
        </div>
        <div class="field">
          <label for="brand">Marca</label>
          <input id="brand" name="brand" maxlength="120" required [(ngModel)]="form.brand">
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
              placeholder="0"
              required
              [ngModel]="priceInput"
              (ngModelChange)="setPrice($event)"
            >
          </div>
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
                <td>{{ product.price }}</td>
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

    @if (productToDelete) {
      <div class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-title">
        <article class="confirm-card">
          <h2 id="delete-title">Se quiere eliminar un producto</h2>
          <p>Esta accion eliminara <strong>{{ productToDelete.name }}</strong> del catalogo.</p>
          <div class="actions">
            <button class="btn secondary" type="button" (click)="productToDelete = undefined">Cancelar</button>
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
  `],
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  editingId = '';
  form: Partial<Product> = { name: '', brand: '', price: 0 };
  formErrors: string[] = [];
  priceInput = '';
  productToDelete?: Product;

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
    this.api.products().subscribe((products) => this.products = products);
  }

  save(): void {
    this.formErrors = this.validateForm();

    if (this.formErrors.length) {
      return;
    }

    this.api.saveProduct(this.form, this.editingId || undefined).subscribe({
      next: () => {
        this.reset();
        this.load();
      },
      error: (error) => {
        this.formErrors = this.extractErrors(error);
      },
    });
  }

  edit(product: Product): void {
    this.editingId = product.id;
    this.form = { name: product.name, brand: product.brand, price: product.price };
    this.priceInput = String(product.price);
    this.formErrors = [];
  }

  view(product: Product): void {
    alert(`${product.product_code}\n${product.name}\nMarca: ${product.brand}`);
  }

  remove(product: Product): void {
    this.productToDelete = product;
  }

  confirmDelete(): void {
    if (!this.productToDelete) {
      return;
    }

    this.api.deleteProduct(this.productToDelete.id).subscribe(() => {
      this.productToDelete = undefined;
      this.load();
    });
  }

  reset(): void {
    this.editingId = '';
    this.form = { name: '', brand: '', price: 0 };
    this.priceInput = '';
    this.formErrors = [];
  }

  download(type: 'pdf' | 'excel'): void {
    this.api.download('products', type).subscribe((blob) => saveBlob(blob, `productos.${type === 'pdf' ? 'pdf' : 'xlsx'}`));
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
}
