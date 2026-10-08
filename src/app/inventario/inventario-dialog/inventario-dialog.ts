import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Producto } from '../../productos/producto';

@Component({
  selector: 'app-inventario-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.producto ? 'Ajustar Stock: ' + data.producto.nombre : 'Nuevo Producto' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Tipo de Movimiento</mat-label>
            <mat-select formControlName="tipo">
              <mat-option value="ENTRADA">Entrada (Compra/Suministro)</mat-option>
              <mat-option value="SALIDA">Salida (Merma/Retiro)</mat-option>
              <mat-option value="AJUSTE">Ajuste Manual</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Cantidad</mat-label>
            <input matInput type="number" formControlName="cantidad">
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Motivo / Descripción</mat-label>
            <textarea matInput formControlName="motivo" placeholder="Ej: Compra de lote 05/2026"></textarea>
          </mat-form-field>

          <ng-container *ngIf="form.get('tipo')?.value === 'ENTRADA'">
            <div style="display: flex; gap: 10px; margin-top: 10px;">
              <mat-form-field appearance="outline">
                <mat-label>Nuevo Precio Costo</mat-label>
                <input matInput type="number" formControlName="nuevoPrecioCompra">
              </mat-form-field>
              
              <mat-form-field appearance="outline">
                <mat-label>Nuevo Precio Venta</mat-label>
                <input matInput type="number" formControlName="nuevoPrecioVenta">
              </mat-form-field>
            </div>
            <small style="color: gray; margin-bottom: 10px;">
              (Opcional: Llénelo si el costo unitario cambió)
            </small>
          </ng-container>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onSave()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 10px;
    }
    .full-width { width: 100%; }
  `]
})
export class InventarioDialog {
  private fb = inject(FormBuilder);
  dialogRef = inject(MatDialogRef<InventarioDialog>);
  data = inject(MAT_DIALOG_DATA);

  form: FormGroup = this.fb.group({
    tipo: ['ENTRADA', Validators.required],
    cantidad: [null, [Validators.required, Validators.min(1)]],
    motivo: ['', [Validators.required, Validators.maxLength(100)]],
    nuevoPrecioCompra: [null],
    nuevoPrecioVenta: [null]
  });

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    if (this.form.valid) {
      const payload: any = {
        ...this.form.value,
        productoId: this.data.producto.id
      };
      
      if (payload.tipo !== 'ENTRADA') {
        delete payload.nuevoPrecioCompra;
        delete payload.nuevoPrecioVenta;
      }
      
      this.dialogRef.close(payload);
    }
  }
}
