import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CategoriaGastoService, CategoriaGasto } from '../categoria-gasto';
import { SubcategoriaGastoService, SubcategoriaGasto } from '../subcategoria-gasto';
import { UsuarioService, Usuario } from '../../usuarios/usuario';
import { AuthService } from '../../auth/auth';
import { MatIconModule } from '@angular/material/icon';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-gasto-dialog',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Registrar Nuevo Gasto</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="form-grid">
          <mat-form-field appearance="outline">
            <mat-label>Categoría de Gasto</mat-label>
            <mat-select formControlName="categoriaGastoId">
              <mat-option *ngFor="let cat of categorias" [value]="cat.id">
                {{cat.nombre}}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" *ngIf="subcategorias.length > 0">
            <mat-label>Subcategoría de Gasto</mat-label>
            <mat-select formControlName="subcategoriaGastoId">
              <mat-option *ngFor="let subcat of subcategorias" [value]="subcat.id">
                {{subcat.nombre}}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Monto</mat-label>
            <input matInput type="number" formControlName="monto">
            <span matPrefix>$&nbsp;</span>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Descripción / Detalle</mat-label>
            <textarea matInput formControlName="descripcion" rows="3"></textarea>
          </mat-form-field>

          <mat-form-field appearance="outline" *ngIf="isAdmin()" style="width: 100%;">
            <mat-label>Fecha Histórica</mat-label>
            <input matInput [matDatepicker]="pickerGasto" formControlName="fechaHistorica">
            <mat-datepicker-toggle matIconSuffix [for]="pickerGasto"></mat-datepicker-toggle>
            <mat-datepicker #pickerGasto panelClass="pink-datepicker"></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" *ngIf="isAdmin()" style="width: 100%;">
            <mat-label>Asignar a Vendedor</mat-label>
            <mat-select formControlName="usuarioId">
              <mat-option *ngFor="let u of usuarios" [value]="u.id">
                {{u.nombre}} ({{u.rolNombre}})
              </mat-option>
            </mat-select>
            <mat-hint>Si se deja vacío, se asignará a tu sesión actual</mat-hint>
          </mat-form-field>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions class="custom-actions">
      <button mat-button class="cancel-btn" (click)="onCancel()">Cancelar</button>
      <button mat-flat-button class="save-btn" [disabled]="form.invalid" (click)="onSave()">
        <mat-icon>payments</mat-icon> REGISTRAR GASTO
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 8px; padding-top: 10px; }
    ::ng-deep mat-datepicker-toggle,
    ::ng-deep .mat-datepicker-toggle,
    ::ng-deep mat-datepicker-toggle button,
    ::ng-deep mat-datepicker-toggle mat-icon,
    ::ng-deep .mat-datepicker-toggle-default-icon { color: #C2185B !important; }
    
    ::ng-deep .pink-datepicker { z-index: 10000 !important; background: #ffffff !important; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.2) !important; }
    ::ng-deep .pink-datepicker .mat-calendar-body-cell-content { color: #333333 !important; font-weight: 500; }
    ::ng-deep .pink-datepicker .mat-calendar-table-header { color: #C2185B !important; font-weight: bold; }
    ::ng-deep .pink-datepicker .mat-calendar-body-selected { background-color: #e91e63 !important; color: white !important; font-weight: bold; }
    ::ng-deep .pink-datepicker .mat-calendar-body-today:not(.mat-calendar-body-selected) { border-color: #e91e63 !important; }
    ::ng-deep .pink-datepicker .mat-calendar-header { color: #C2185B !important; }
    ::ng-deep .pink-datepicker .mat-calendar-period-button span, 
    ::ng-deep .pink-datepicker .mat-calendar-period-button { color: #C2185B !important; font-weight: 800; }
    ::ng-deep .pink-datepicker .mat-calendar-body-label { color: #C2185B !important; font-weight: 700; }
    ::ng-deep .pink-datepicker .mat-calendar-controls { margin-top: 5px; }
    ::ng-deep .pink-datepicker .mat-calendar-arrow { fill: #C2185B !important; }
    ::ng-deep .pink-datepicker .mat-icon-button { color: #C2185B !important; }
    ::ng-deep .pink-datepicker .mat-calendar-previous-button, ::ng-deep .pink-datepicker .mat-calendar-next-button { color: #C2185B !important; }

    mat-dialog-content { max-height: 65vh; overflow-y: auto; }
    
    .custom-actions {
      padding: 16px 24px !important;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .save-btn {
      width: 100% !important;
      padding: 25px !important;
      border-radius: 12px !important;
      font-weight: 800 !important;
      font-size: 16px !important;
      background-color: #e91e63 !important;
      color: white !important;
      letter-spacing: 1px;
    }

    .save-btn[disabled] {
      background-color: #ccc !important;
      color: #777 !important;
      opacity: 0.6;
    }

    .cancel-btn {
      width: 100% !important;
      color: #888 !important;
    }
  `]
})
export class GastoDialog implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaGastoService = inject(CategoriaGastoService);
  private subcategoriaGastoService = inject(SubcategoriaGastoService);
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  dialogRef = inject(MatDialogRef<GastoDialog>);
  data = inject(MAT_DIALOG_DATA);


  categorias: CategoriaGasto[] = [];
  subcategorias: SubcategoriaGasto[] = [];
  usuarios: Usuario[] = [];

  form: FormGroup = this.fb.group({
    sesionId: [this.data?.sesionId || null],
    categoriaGastoId: ['', Validators.required],
    subcategoriaGastoId: [null],
    monto: ['', [Validators.required, Validators.min(1)]],
    descripcion: ['', [Validators.required, Validators.maxLength(200)]],
    fechaHistorica: [null],
    usuarioId: [null]
  });

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit() {
    this.categoriaGastoService.obtenerTodas().subscribe(res => this.categorias = res);

    if (this.isAdmin()) {
      this.usuarioService.obtenerTodos().subscribe(res => {
        this.usuarios = res.filter(u => u.activo);
      });
      // Para admin, la sesión no es obligatoria ya que se resuelve por usuarioId
      this.form.get('sesionId')?.clearValidators();
    } else {
      // Para cajeros, la sesión sí es obligatoria
      this.form.get('sesionId')?.setValidators(Validators.required);
    }
    this.form.get('sesionId')?.updateValueAndValidity();

    this.form.get('categoriaGastoId')?.valueChanges.subscribe(catId => {
      // Limpiar subcategoría al cambiar categoría
      this.form.get('subcategoriaGastoId')?.setValue(null);
      this.form.get('subcategoriaGastoId')?.clearValidators();
      
      if (catId) {
        this.subcategoriaGastoService.obtenerPorCategoria(catId).subscribe(res => {
          this.subcategorias = res;
          // Si hay subcategorías, la hacemos obligatoria, si no, la limpiamos.
          if (this.subcategorias.length > 0) {
            this.form.get('subcategoriaGastoId')?.setValidators(Validators.required);
          } else {
            this.form.get('subcategoriaGastoId')?.clearValidators();
          }
          this.form.get('subcategoriaGastoId')?.updateValueAndValidity();
        });
      } else {
        this.subcategorias = [];
      }
    });
  }

  onCancel() { this.dialogRef.close(); }

  onSave() {
    if (this.form.valid) {
      const payload = { ...this.form.value };
      if (payload.fechaHistorica) {
        const d = new Date(payload.fechaHistorica);
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        payload.fechaHistorica = `${yr}-${mo}-${da}`;
      } else {
        delete payload.fechaHistorica;
      }
      this.dialogRef.close(payload);
    }
  }
}
