import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CategoriaService, Categoria } from '../../categorias/categoria';
import { Producto } from '../producto';
import { CloudinaryService } from '../../cloudinary.service';
import { ToastService } from '../../shared/toast.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-producto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data ? 'Editar Producto' : 'Nuevo Producto' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form">
        <div class="form-grid">
          
          <div class="image-upload-container">
            <input type="file" #fileInput (change)="onFileSelected($event)" accept="image/*" capture="environment" style="display: none;">
            
            <div class="image-preview" *ngIf="form.get('imagenUrl')?.value">
              <img [src]="form.get('imagenUrl')?.value" class="preview-img">
            </div>

            <button mat-stroked-button color="primary" type="button" (click)="fileInput.click()" [disabled]="uploading" class="upload-btn">
              <mat-icon>{{ form.get('imagenUrl')?.value ? 'cameraswitch' : 'add_a_photo' }}</mat-icon> 
              {{ form.get('imagenUrl')?.value ? 'Cambiar Foto / Tomar Otra' : 'Tomar Foto / Subir Imagen' }}
            </button>
            <div *ngIf="uploading" class="uploading-text">
              <mat-icon class="spinner">sync</mat-icon> Subiendo imagen...
            </div>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Nombre del Producto</mat-label>
            <input matInput formControlName="nombre" placeholder="Ej: Moño Rosa">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Referencia (SKU)</mat-label>
            <input matInput formControlName="referencia" placeholder="Ej: SAN-001">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Categoría</mat-label>
            <mat-select formControlName="categoriaId">
              <mat-option *ngFor="let cat of categorias" [value]="cat.id">
                {{cat.nombre}}
              </mat-option>
            </mat-select>
          </mat-form-field>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Precio Compra</mat-label>
              <input matInput type="number" formControlName="precioCompra">
              <span matPrefix>$&nbsp;</span>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Precio Venta</mat-label>
              <input matInput type="number" formControlName="precioVenta">
              <span matPrefix>$&nbsp;</span>
            </mat-form-field>
          </div>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Stock Inicial</mat-label>
              <input matInput type="number" formControlName="stockActual">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Stock Mínimo</mat-label>
              <input matInput type="number" formControlName="stockMinimo">
            </mat-form-field>
          </div>

          <div class="row">
            <mat-form-field appearance="outline">
              <mat-label>Descripción Corta</mat-label>
              <textarea matInput formControlName="descripcion" placeholder="Detalles del material, estilo, etc." rows="2"></textarea>
            </mat-form-field>
          </div>

          <mat-slide-toggle formControlName="activo">Producto Activo</mat-slide-toggle>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="onSave()">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-grid { display: flex; flex-direction: column; gap: 4px; padding-top: 10px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .image-upload-container { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; align-items: center; background: rgba(216, 27, 96, 0.03); padding: 16px; border-radius: 16px; border: 1px dashed var(--primary-pink); }
    .image-preview { width: 100%; display: flex; justify-content: center; }
    .preview-img { max-width: 150px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 2px solid white; object-fit: cover; }
    .upload-btn { width: 100%; font-weight: 600; padding: 6px 0; border-width: 2px; }
    .uploading-text { display: flex; align-items: center; gap: 8px; color: var(--primary-pink); font-weight: 500; font-size: 14px; margin-top: 4px; }
    .spinner { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
export class ProductoDialog implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private cloudinaryService = inject(CloudinaryService);
  private snackBar = inject(ToastService);
  dialogRef = inject(MatDialogRef<ProductoDialog>);
  data = inject(MAT_DIALOG_DATA);

  categorias: Categoria[] = [];
  uploading = false;

  form: FormGroup = this.fb.group({
    nombre: [this.data?.nombre || '', Validators.required],
    referencia: [this.data?.referencia || '', Validators.required],
    categoriaId: [this.data?.categoriaId || this.data?.categoria?.id || '', Validators.required],
    precioCompra: [this.data?.precioCompra || 0, [Validators.required, Validators.min(0)]],
    precioVenta: [this.data?.precioVenta || 0, [Validators.required, Validators.min(0)]],
    stockActual: [this.data?.stockActual || 0, [Validators.required, Validators.min(0)]],
    stockMinimo: [this.data?.stockMinimo || 1, [Validators.required, Validators.min(0)]],
    activo: [this.data?.activo ?? true],
    imagenUrl: [this.data?.imagenUrl || ''],
    descripcion: [this.data?.descripcion || '']
  });

  ngOnInit() {
    this.categoriaService.obtenerTodas().subscribe((res: Categoria[]) => this.categorias = res);
  }

  onCancel() { this.dialogRef.close(); }

  onSave() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.uploading = true;
      this.cloudinaryService.uploadImage(file).subscribe({
        next: (res: any) => {
          const url = res.secure_url || res.url;
          this.form.patchValue({ imagenUrl: url });
          this.uploading = false;
          this.snackBar.success('La imagen se subió a la nube correctamente.', 'Imagen subida');
        },
        error: (err) => {
          console.error('Error al subir imagen', err);
          this.uploading = false;
          let msj = 'Hubo un error al subir la imagen. Intenta de nuevo.';
          if (err.status === 403 || err.status === 401) msj = 'No tienes permiso para subir fotos.';
          else if (err.status === 500) msj = 'Error en el servidor de Cloudinary (Verifica las credenciales).';
          this.snackBar.error(msj, 'No se pudo subir la imagen');
        }
      });
    }
  }
}

