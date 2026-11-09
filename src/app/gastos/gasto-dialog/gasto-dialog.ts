import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
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
    MatSlideToggleModule,
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

          <!-- Tipo de gasto: disponible para admin, vendedor y jefe -->
          <div class="tipo-gasto-toggle">
            <div class="toggle-label">
              <mat-icon>{{ form.get('esDeCaja')?.value ? 'point_of_sale' : 'account_balance' }}</mat-icon>
              <span>Tipo de gasto:</span>
              <strong [class.de-caja]="form.get('esDeCaja')?.value" [class.general]="!form.get('esDeCaja')?.value">
                {{ form.get('esDeCaja')?.value ? 'Sale de la caja' : 'Gasto general (no afecta caja)' }}
              </strong>
            </div>
            <mat-slide-toggle formControlName="esDeCaja" color="accent">
            </mat-slide-toggle>
          </div>
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
    ::ng-deep .mat-datepicker-toggle-default-icon { color: var(--primary-pink) !important; }
    
    ::ng-deep .pink-datepicker { z-index: 10000 !important; background: #ffffff !important; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.2) !important; }
    ::ng-deep .pink-datepicker .mat-calendar-body-cell-content { color: #333333 !important; font-weight: 500; }
    ::ng-deep .pink-datepicker .mat-calendar-table-header { color: var(--primary-pink) !important; font-weight: bold; }
    ::ng-deep .pink-datepicker .mat-calendar-body-selected { background-color: var(--primary-pink) !important; color: white !important; font-weight: bold; }
    ::ng-deep .pink-datepicker .mat-calendar-body-today:not(.mat-calendar-body-selected) { border-color: var(--primary-pink) !important; }
    ::ng-deep .pink-datepicker .mat-calendar-header { color: var(--primary-pink) !important; }
    ::ng-deep .pink-datepicker .mat-calendar-period-button span, 
    ::ng-deep .pink-datepicker .mat-calendar-period-button { color: var(--primary-pink) !important; font-weight: 800; }
    ::ng-deep .pink-datepicker .mat-calendar-body-label { color: var(--primary-pink) !important; font-weight: 700; }
    ::ng-deep .pink-datepicker .mat-calendar-controls { margin-top: 5px; }
    ::ng-deep .pink-datepicker .mat-calendar-arrow { fill: var(--primary-pink) !important; }
    ::ng-deep .pink-datepicker .mat-icon-button { color: var(--primary-pink) !important; }
    ::ng-deep .pink-datepicker .mat-calendar-previous-button, ::ng-deep .pink-datepicker .mat-calendar-next-button { color: var(--primary-pink) !important; }

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
      background-color: var(--primary-pink) !important;
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

    .tipo-gasto-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 12px;
      background: #fafafa;
      border: 1px solid #e0e0e0;
      margin-top: 4px;
    }
    .toggle-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #555;
    }
    .toggle-label mat-icon { font-size: 20px; width: 20px; height: 20px; color: #888; }
    .de-caja { color: #2e7d32; font-weight: 700; }
    .general { color: #1565c0; font-weight: 700; }
  `]
})
export class GastoDialog implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaGastoService = inject(CategoriaGastoService);
  private subcategoriaGastoService = inject(SubcategoriaGastoService);
  private usuarioService = inject(UsuarioService);
  private authService = inject(AuthService);
  dialogRef = inject(MatDialogRef<GastoDialog>);
  private dialog = inject(MatDialog);
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
    usuarioId: [null],
    esDeCaja: [true]  // Default: sale de caja. Admin, vendedor y jefe pueden cambiarlo.
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

      const categoria = this.categorias.find(c => c.id === this.form.value.categoriaGastoId);
      const subcategoria = this.subcategorias.find(s => s.id === this.form.value.subcategoriaGastoId);

      const confirmacion = this.dialog.open(ConfirmarGastoDialog, {
        width: '430px',
        disableClose: true,
        data: {
          monto: this.form.value.monto,
          descripcion: this.form.value.descripcion,
          categoria: [categoria?.nombre, subcategoria?.nombre].filter(Boolean).join(' / '),
          esDeCaja: !!this.form.value.esDeCaja
        }
      });

      confirmacion.afterClosed().subscribe(confirmado => {
        if (confirmado) {
          this.dialogRef.close(payload);
        }
      });
    }
  }
}

@Component({
  selector: 'app-confirmar-gasto-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-wrapper">
      <div class="icon" [class.caja]="data.esDeCaja" [class.general]="!data.esDeCaja">
        <mat-icon>{{ data.esDeCaja ? 'point_of_sale' : 'account_balance' }}</mat-icon>
      </div>

      <h2 class="titulo">¿Está seguro que desea registrar este gasto?</h2>

      <div class="detalle">
        <div class="fila">
          <span>Monto</span>
          <strong class="monto">{{ data.monto | currency:'COP' }}</strong>
        </div>
        <div class="fila">
          <span>Descripción</span>
          <strong>{{ data.descripcion }}</strong>
        </div>
        <div class="fila" *ngIf="data.categoria">
          <span>Categoría</span>
          <strong>{{ data.categoria }}</strong>
        </div>
      </div>

      <div class="aviso" [class.caja]="data.esDeCaja" [class.general]="!data.esDeCaja">
        <mat-icon>{{ data.esDeCaja ? 'payments' : 'info' }}</mat-icon>
        <span *ngIf="data.esDeCaja">
          <strong>Este gasto SALE DE LA CAJA.</strong>
          El dinero se descuenta del efectivo al cerrar caja.
        </span>
        <span *ngIf="!data.esDeCaja">
          <strong>Este gasto NO saldrá de la caja.</strong>
          Es un gasto general y no afecta el efectivo.
        </span>
      </div>

      <div class="acciones">
        <button mat-button class="btn-corregir" (click)="dialogRef.close(false)">Corregir</button>
        <button mat-flat-button color="warn" class="btn-ok" (click)="dialogRef.close(true)">
          Sí, registrar gasto
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-wrapper { padding: 24px 20px 16px; text-align: center; }
    .icon { display: flex; justify-content: center; align-items: center; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 12px; }
    .icon mat-icon { font-size: 32px; width: 32px; height: 32px; }
    .icon.caja { background: #e8f5e9; color: #2e7d32; }
    .icon.general { background: #e3f2fd; color: #1565c0; }
    .titulo { font-size: 1.2rem; font-weight: 800; color: #333; margin: 0 0 16px; }
    .detalle { background: #fafafa; border: 1px solid #eee; border-radius: 12px; padding: 12px 16px; text-align: left; margin-bottom: 14px; }
    .fila { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; font-size: 0.95rem; }
    .fila span { color: #666; }
    .fila strong { color: #333; text-align: right; }
    .fila .monto { font-size: 1.3rem; color: #d32f2f; }
    .aviso { display: flex; align-items: flex-start; gap: 8px; text-align: left; border-radius: 10px; padding: 10px 14px; font-size: 0.9rem; line-height: 1.4; margin-bottom: 18px; }
    .aviso mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px; }
    .aviso.caja { background: #e8f5e9; border: 1px solid #a5d6a7; color: #2e7d32; }
    .aviso.general { background: #e3f2fd; border: 1px solid #90caf9; color: #1565c0; }
    .acciones { display: flex; flex-direction: column; gap: 8px; }
    .btn-corregir { color: #666; }
    .btn-ok { padding: 6px 16px; border-radius: 8px; font-weight: 700; }
  `]
})
export class ConfirmarGastoDialog {
  dialogRef = inject(MatDialogRef<ConfirmarGastoDialog>);
  data = inject(MAT_DIALOG_DATA);
}
