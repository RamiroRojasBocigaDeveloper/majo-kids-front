import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { ProductoService, Producto } from './producto';
import { ProductoDialog } from './producto-dialog/producto-dialog';
import { SuccessDialog } from '../shared/success-dialog';
import { ToastService } from '../shared/toast.service';
import { mensajeErrorHttp } from '../shared/http-error';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule
  ],
  template: `
    <mat-card class="header-card">
      <div class="header-content">
        <div class="title-group">
          <h1>Catálogo de Productos</h1>
          <p>Gestiona las referencias, precios y existencias de tu inventario</p>
        </div>
        <button mat-fab color="primary" (click)="abrirDialogo()" title="Nuevo Producto">
          <mat-icon>add_shopping_cart</mat-icon>
        </button>
      </div>
    </mat-card>

    <mat-card class="luxury-card search-card">
      <mat-form-field appearance="outline" class="full-width search-field">
        <mat-label>Buscar producto por nombre o referencia...</mat-label>
        <input matInput (keyup)="buscar($event)" #searchInput>
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
    </mat-card>

    <mat-card class="luxury-card">
      <mat-card-content>
        <table mat-table [dataSource]="productos()" class="full-width">
          <ng-container matColumnDef="referencia">
            <th mat-header-cell *matHeaderCellDef> Ref/SKU </th>
            <td mat-cell *matCellDef="let p"> 
              <span class="ref-badge">{{p.referencia}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef> Nombre del Producto </th>
            <td mat-cell *matCellDef="let p"> {{p.nombre}} </td>
          </ng-container>

          <ng-container matColumnDef="categoria">
            <th mat-header-cell *matHeaderCellDef> Categoría </th>
            <td mat-cell *matCellDef="let p"> 
              {{p.categoriaNombre || p.categoria?.nombre || 'General'}} 
            </td>
          </ng-container>

          <ng-container matColumnDef="precios">
            <th mat-header-cell *matHeaderCellDef> Precio Venta </th>
            <td mat-cell *matCellDef="let p"> 
              <span class="price-tag">{{p.precioVenta | currency:'COP'}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="stock">
            <th mat-header-cell *matHeaderCellDef> Stock </th>
            <td mat-cell *matCellDef="let p">
              <mat-chip-set>
                <mat-chip [class.stock-low]="p.stockActual <= p.stockMinimo" [class.stock-ok]="p.stockActual > p.stockMinimo">
                  {{p.stockActual}} u.
                </mat-chip>
              </mat-chip-set>
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef> Estado </th>
            <td mat-cell *matCellDef="let p">
              <span [class.status-active]="p.activo" [class.status-inactive]="!p.activo">
                {{ p.activo ? 'Disponible' : 'Inactivo' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef> - </th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button color="accent" (click)="abrirDialogo(p)" title="Editar">
                <mat-icon>edit_note</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="eliminar(p)" title="Eliminar">
                <mat-icon>delete_sweep</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <div *ngIf="loading" class="state-container">
          <p>Cargando productos...</p>
        </div>

        <div *ngIf="!loading && productos().length === 0" class="state-container">
          <p>No se encontraron productos.</p>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .search-card { margin-bottom: 20px; padding: 12px 24px 0 24px; }
    .search-field { margin-bottom: 0px; }
    .full-width { width: 100%; }
    .ref-badge { font-family: monospace; background: #f0f0f0; padding: 2px 8px; border-radius: 4px; color: #555; }
    .price-tag { font-weight: 800; color: var(--primary-pink); }
    .status-active { color: #2e7d32; font-weight: 600; }
    .status-inactive { color: #d32f2f; font-weight: 600; }
    .stock-low { background-color: #ffebee !important; color: #c62828 !important; }
    .stock-ok { background-color: #e8f5e9 !important; color: #2e7d32 !important; }
    .state-container { padding: 60px; text-align: center; color: #999; }
    
    ::ng-deep th.mat-mdc-header-cell {
      color: var(--primary-pink) !important;
      font-weight: 700 !important;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
  `]
})
export class Productos implements OnInit {
  private productoService = inject(ProductoService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  productos = signal<Producto[]>([]);
  loading = false;
  displayedColumns = ['referencia', 'nombre', 'categoria', 'precios', 'stock', 'estado', 'acciones'];

  ngOnInit() {
    this.cargarProductos();
  }

  cargarProductos() {
    this.loading = true;
    this.productoService.obtenerTodos().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.loading = false;
      },
      error: (err) => {
        this.toast.error(mensajeErrorHttp(err, 'No se pudo cargar el catálogo de productos.'), 'Error');
        this.loading = false;
      }
    });
  }

  buscar(event: Event) {
    const term = (event.target as HTMLInputElement).value;
    if (term.length >= 3) {
      this.productoService.buscar(term).subscribe(data => this.productos.set(data));
    } else if (term.length === 0) {
      this.cargarProductos();
    }
  }

  abrirDialogo(producto?: Producto) {
    const dialogRef = this.dialog.open(ProductoDialog, {
      width: '500px',
      data: producto || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (producto?.id) {
          this.productoService.actualizar(producto.id, result).subscribe({
            next: () => {
              this.toast.success('El producto fue actualizado correctamente.', 'Producto actualizado');
              this.cargarProductos();
            },
            error: (err) => {
              this.toast.error(mensajeErrorHttp(err, 'No se pudo actualizar el producto'), 'Error');
            }
          });
        } else {
          this.productoService.crear(result).subscribe({
            next: () => {
              this.toast.success('El producto se creó exitosamente.', 'Producto creado');
              this.cargarProductos();
            },
            error: (err) => {
              this.toast.error(mensajeErrorHttp(err, 'No se pudo crear el producto'), 'Error');
            }
          });
        }
      }
    });
  }

  eliminar(p: Producto) {
    const dialogRef = this.dialog.open(SuccessDialog, {
      width: '420px',
      disableClose: true,
      data: {
        icon: '🗑️',
        title: 'Eliminar Producto',
        message: `¿Estás seguro de eliminar "${p.nombre}"? Esta acción no se puede deshacer.`,
        btnText: 'Eliminar',
        btnIcon: 'delete',
        showCancel: true
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.productoService.eliminar(p.id!).subscribe({
          next: () => {
            this.toast.success('El producto fue eliminado del sistema.', 'Producto eliminado');
            this.cargarProductos();
          },
          error: (err) => {
            this.toast.error(mensajeErrorHttp(err, 'No se puede eliminar este producto'), 'Error');
          }
        });
      }
    });
  }
}
