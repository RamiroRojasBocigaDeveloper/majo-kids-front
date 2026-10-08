import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoriaService, Categoria } from './categoria';
import { CategoriaDialog } from './categoria-dialog/categoria-dialog';
import { SuccessDialog } from '../shared/success-dialog';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-categorias',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './categorias.html',
  styleUrls: ['./categorias.css']
})
export class Categorias implements OnInit {
  categorias: Categoria[] = [];
  displayedColumns: string[] = ['id', 'nombre', 'acciones'];
  loading = false;

  private categoriaService = inject(CategoriaService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  ngOnInit(): void {
    this.cargarCategorias();
  }

  cargarCategorias() {
    this.loading = true;
    this.categoriaService.obtenerTodas().subscribe({
      next: (data) => {
        this.categorias = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toast.error('No se pudieron cargar las categorías.', 'Error');
      }
    });
  }

  abrirDialogo(categoria?: Categoria) {
    const dialogRef = this.dialog.open(CategoriaDialog, {
      width: '400px',
      data: categoria ? { ...categoria } : null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.toast.success(`La categoría "${result.nombre}" se ha guardado correctamente.`, result.action === 'created' ? 'Categoría creada' : 'Categoría actualizada');
        this.cargarCategorias();
      }
    });
  }

  eliminar(id: number) {
    const dialogRef = this.dialog.open(SuccessDialog, {
      width: '420px',
      disableClose: true,
      data: {
        icon: '🗑️',
        title: 'Eliminar Categoría',
        message: '¿Estás seguro de eliminar esta categoría?',
        btnText: 'Eliminar',
        btnIcon: 'delete',
        showCancel: true
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.categoriaService.eliminar(id).subscribe({
          next: () => {
            this.toast.success('La categoría se ha borrado del sistema.', 'Categoría eliminada');
            this.cargarCategorias();
          },
          error: (err) => {
            this.toast.error(err.error?.message || 'No se pudo eliminar la categoría', 'Error');
          }
        });
      }
    });
  }
}
