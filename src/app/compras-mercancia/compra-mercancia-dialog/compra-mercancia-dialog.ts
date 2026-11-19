import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { Producto, ProductoService } from '../../productos/producto';
import { ProductoDialog } from '../../productos/producto-dialog/producto-dialog';
import { ToastService } from '../../shared/toast.service';
import { mensajeErrorHttp } from '../../shared/http-error';
import { CompraMercanciaRequest, MetodoPagoCompra } from '../compra-mercancia';

@Component({
  selector: 'app-compra-mercancia-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule
  ],
  template: `
    <h2 mat-dialog-title>Nueva compra de mercancía</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="compra-form">
        <div class="grid-2">
          <mat-form-field appearance="outline">
            <mat-label>Fecha de la compra</mat-label>
            <input matInput [matDatepicker]="picker" formControlName="fecha">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Método de pago</mat-label>
            <mat-select formControlName="metodoPago">
              <mat-option value="EFECTIVO">Efectivo</mat-option>
              <mat-option value="TRANSFERENCIA">Transferencia</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div class="grid-2">
          <mat-form-field appearance="outline">
            <mat-label>Proveedor (opcional)</mat-label>
            <input matInput formControlName="proveedor" maxlength="150">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Descripción (opcional)</mat-label>
            <input matInput formControlName="descripcion" maxlength="200">
          </mat-form-field>
        </div>

        <div class="aviso">
          <mat-icon>info</mat-icon>
          <span>
            Esta compra <strong>no afecta la caja del vendedor</strong>. Actualiza el stock y el costo,
            y descuenta del capital disponible del almacén. Si indicas el precio de venta, también
            se actualiza en el producto.
          </span>
        </div>

        <div class="lineas-head">
          <div>
            <span class="eyebrow">Productos</span>
            <h3>Detalle de la compra</h3>
          </div>
          <div class="head-actions">
            <button mat-stroked-button type="button" class="new-prod-btn" (click)="crearNuevoProducto()">
              <mat-icon>add_circle_outline</mat-icon> Nuevo producto
            </button>
            <button mat-stroked-button type="button" class="add-btn" (click)="agregarLinea()">
              <mat-icon>add</mat-icon> Agregar fila
            </button>
          </div>
        </div>

        <div formArrayName="lineas" class="lineas">
          <div class="linea" *ngFor="let linea of lineas.controls; let i = index" [formGroupName]="i">
            <div class="linea-num">{{ i + 1 }}</div>

            <mat-form-field appearance="outline" class="producto-field">
              <mat-label>Producto</mat-label>
              <mat-select formControlName="productoId" (selectionChange)="onProductoChange(i)">
                <mat-option *ngFor="let p of productos" [value]="p.id">
                  {{ p.nombre }} ({{ p.referencia }}) · stock {{ p.stockActual }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-icon-button type="button" class="remove-btn"
                    [disabled]="lineas.length === 1"
                    (click)="quitarLinea(i)" aria-label="Quitar producto">
              <mat-icon>delete_outline</mat-icon>
            </button>

            <div class="linea-campos">
              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Cantidad</mat-label>
                <input matInput type="number" min="1" formControlName="cantidad">
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Costo unitario</mat-label>
                <input matInput type="number" min="1" formControlName="costoUnitario">
                <span matTextPrefix>$&nbsp;</span>
              </mat-form-field>

              <mat-form-field appearance="outline" floatLabel="always">
                <mat-label>Precio de venta</mat-label>
                <input matInput type="number" min="0" formControlName="precioVenta">
                <span matTextPrefix>$&nbsp;</span>
                <mat-hint>Opcional</mat-hint>
              </mat-form-field>

              <div class="subtotal">
                <span>Subtotal</span>
                <strong>{{ subtotalLinea(i) | currency:'COP':'symbol':'1.0-0' }}</strong>
              </div>
            </div>
          </div>
        </div>

        <div class="total-row">
          <span>Total de la compra</span>
          <strong>{{ total() | currency:'COP':'symbol':'1.0-0' }}</strong>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions class="acciones">
      <button mat-button type="button" (click)="cancelar()">Cancelar</button>
      <button mat-flat-button class="save-btn" type="button"
              [disabled]="form.invalid || lineas.length === 0"
              (click)="guardar()">
        <mat-icon>shopping_basket</mat-icon> Registrar compra
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { max-height: 72vh; }
    .compra-form { display: flex; flex-direction: column; gap: 10px; padding-top: 8px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    @media (max-width: 560px) { .grid-2 { grid-template-columns: 1fr; } }
    .aviso { display: flex; gap: 10px; align-items: flex-start; background: #fff8e1;
             border: 1px solid #ffe082; color: #8d6e63; border-radius: 10px; padding: 10px 12px;
             font-size: 0.82rem; line-height: 1.4; }
    .aviso mat-icon { color: #f57c00; font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .lineas-head { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4px; gap: 10px; }
    .head-actions { display: flex; gap: 8px; flex-wrap: wrap; }
    .new-prod-btn { border-color: #2e7d32 !important; color: #2e7d32 !important; }
    .lineas-head h3 { margin: 0; font-size: 1.05rem; }
    .eyebrow { font-size: 0.72rem; text-transform: uppercase; color: #999; font-weight: 700; }
    .lineas { display: flex; flex-direction: column; gap: 6px; }
    .linea { display: grid; grid-template-columns: 28px minmax(0, 1fr) 40px;
             grid-template-areas:
               "num producto remove"
               ". campos campos";
             gap: 6px 10px; align-items: start; background: #fafafa; border: 1px solid #eee;
             border-radius: 12px; padding: 10px 12px; }
    .linea-num { grid-area: num; width: 24px; height: 24px; border-radius: 50%;
                 background: var(--primary-pink); color: #fff; display: flex;
                 align-items: center; justify-content: center; align-self: center;
                 font-size: 0.75rem; font-weight: 800; }
    .producto-field { grid-area: producto; }
    .remove-btn { grid-area: remove; justify-self: end; align-self: center; color: #c62828; }
    .linea-campos { grid-area: campos; display: grid;
                    grid-template-columns: 92px 160px 170px minmax(120px, 1fr);
                    gap: 10px; align-items: center; }
    @media (max-width: 680px) {
      .linea-campos { grid-template-columns: 1fr 1fr; }
    }
    .subtotal { display: flex; flex-direction: column; align-items: flex-end;
                font-size: 0.76rem; color: #777; justify-self: end; }
    .subtotal strong { font-size: 1rem; color: #2e7d32; }
    .total-row { display: flex; justify-content: space-between; align-items: center;
                 padding: 12px 16px; background: #fdf5f5; border-radius: 10px;
                 margin-top: 6px; font-weight: 700; color: #333; }
    .total-row strong { font-size: 1.25rem; color: var(--primary-pink); }
    .acciones { display: flex; justify-content: flex-end; gap: 8px; padding: 12px 16px; }
    .save-btn { background: var(--primary-pink) !important; color: #fff !important; }
  `]
})
export class CompraMercanciaDialog implements OnInit {
  private fb = inject(FormBuilder);
  private productoService = inject(ProductoService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private dialogRef = inject(MatDialogRef<CompraMercanciaDialog>);

  productos: Producto[] = [];

  form: FormGroup = this.fb.group({
    fecha: [new Date(), Validators.required],
    proveedor: [''],
    metodoPago: ['EFECTIVO' as MetodoPagoCompra, Validators.required],
    descripcion: [''],
    lineas: this.fb.array([this.crearLinea()])
  });

  get lineas(): FormArray {
    return this.form.get('lineas') as FormArray;
  }

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos(seleccionarId?: number) {
    this.productoService.obtenerTodos().subscribe({
      next: (res) => {
        this.productos = res.filter(p => p.activo !== false);
        if (seleccionarId && this.lineas.length > 0) {
          const ultimaLinea = this.lineas.at(this.lineas.length - 1) as FormGroup;
          ultimaLinea.get('productoId')?.setValue(seleccionarId);
          this.onProductoChange(this.lineas.length - 1);
        }
      },
      error: () => this.productos = []
    });
  }

  crearNuevoProducto() {
    const dialogRef = this.dialog.open(ProductoDialog, {
      width: '500px',
      data: null
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (!result) return;
      // El stock inicial se gestiona a través de la compra
      result.stockActual = 0;
      this.productoService.crear(result).subscribe({
        next: (nuevo) => {
          this.toast.success(`Producto "${nuevo.nombre}" creado exitosamente.`, 'Producto Creado');
          this.cargarProductos(nuevo.id);
        },
        error: (err) => {
          this.toast.error(mensajeErrorHttp(err, 'No se pudo crear el producto'), 'Error');
        }
      });
    });
  }

  private crearLinea(): FormGroup {
    return this.fb.group({
      productoId: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      costoUnitario: [null, [Validators.required, Validators.min(1)]],
      precioVenta: [null, [Validators.min(0)]]
    });
  }

  agregarLinea() {
    this.lineas.push(this.crearLinea());
  }

  quitarLinea(index: number) {
    if (this.lineas.length > 1) {
      this.lineas.removeAt(index);
    }
  }

  onProductoChange(index: number) {
    const linea = this.lineas.at(index) as FormGroup;
    const producto = this.productos.find(p => p.id === Number(linea.get('productoId')?.value));
    if (producto) {
      linea.get('costoUnitario')?.setValue(producto.precioCompra);
      linea.get('precioVenta')?.setValue(producto.precioVenta ?? null);
    }
  }

  subtotalLinea(index: number): number {
    const linea = this.lineas.at(index) as FormGroup;
    const cant = Number(linea.get('cantidad')?.value || 0);
    const costo = Number(linea.get('costoUnitario')?.value || 0);
    return cant * costo;
  }

  total(): number {
    return this.lineas.controls.reduce((sum, _, i) => sum + this.subtotalLinea(i), 0);
  }

  guardar() {
    if (this.form.invalid) return;

    const request: CompraMercanciaRequest = {
      fecha: this.formatearFecha(this.form.value.fecha),
      proveedor: this.limpiar(this.form.value.proveedor),
      descripcion: this.limpiar(this.form.value.descripcion),
      metodoPago: this.form.value.metodoPago,
      lineas: this.lineas.controls.map((control: any) => ({
        productoId: Number(control.value.productoId),
        cantidad: Number(control.value.cantidad),
        costoUnitario: Number(control.value.costoUnitario),
        precioVenta: this.numeroOpcional(control.value.precioVenta)
      }))
    };

    this.dialogRef.close(request);
  }

  cancelar() {
    this.dialogRef.close();
  }

  private limpiar(valor: any): string | undefined {
    if (!valor) return undefined;
    const t = String(valor).trim();
    return t.length > 0 ? t : undefined;
  }

  private numeroOpcional(valor: any): number | undefined {
    if (valor === null || valor === undefined || valor === '') return undefined;
    const n = Number(valor);
    return isNaN(n) ? undefined : n;
  }

  private formatearFecha(fecha: any): string {
    if (!fecha) return new Date().toISOString().substring(0, 10);
    const d = new Date(fecha);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}