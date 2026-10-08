import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CategoriaService, Categoria } from '../categoria';
import { ToastService } from '../../shared/toast.service';

function minLengthSinEspacios(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    if (valor == null || valor === '') {
      return null;
    }
    const largo = String(valor).trim().length;
    return largo < min
      ? { minLengthSinEspacios: { requiredLength: min, actualLength: largo } }
      : null;
  };
}

@Component({
  selector: 'app-categoria-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './categoria-dialog.html',
  styleUrls: ['./categoria-dialog.css']
})
export class CategoriaDialog {
  form: FormGroup;
  isEdit: boolean;
  loading = false;

  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private snackBar = inject(ToastService);

  constructor(
    public dialogRef: MatDialogRef<CategoriaDialog>,
    @Inject(MAT_DIALOG_DATA) public data: Categoria
  ) {
    this.isEdit = !!data;
    this.form = this.fb.group({
      nombre: [data?.nombre || '', [Validators.required, minLengthSinEspacios(3), Validators.maxLength(50)]]
    });
  }

  guardar() {
    if (this.form.valid) {
      this.loading = true;
      const rawNombre = this.form.value.nombre?.trim();
      const categoriaData = { ...this.form.value, nombre: rawNombre };

      if (this.isEdit) {
        this.categoriaService.actualizar(this.data.id!, categoriaData).subscribe({
          next: () => this.dialogRef.close({ action: 'updated', nombre: categoriaData.nombre }),
          error: (err) => {
            this.loading = false;
            this.snackBar.error(this.mensajeDeError(err, 'No se pudo actualizar la categoría.'), 'Error');
          }
        });
      } else {
        this.categoriaService.crear(categoriaData).subscribe({
          next: (res) => this.dialogRef.close({ action: 'created', nombre: res.nombre }),
          error: (err) => {
            this.loading = false;
            this.snackBar.error(this.mensajeDeError(err, 'No se pudo crear la categoría.'), 'Error');
          }
        });
      }
    }
  }

  private mensajeDeError(err: any, fallback: string): string {
    const cuerpo = err?.error;
    const detalle = Array.isArray(cuerpo?.errors) && cuerpo.errors.length > 0 ? cuerpo.errors[0] : null;
    const mensaje = detalle ?? cuerpo?.message ?? (typeof cuerpo === 'string' ? cuerpo : null);
    return mensaje ? String(mensaje).replace(/^[a-zA-Z_]+:\s*/, '') : fallback;
  }
}
