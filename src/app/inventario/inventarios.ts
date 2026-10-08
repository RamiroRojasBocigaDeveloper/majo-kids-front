import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ProductoService, Producto } from '../productos/producto';
import { CategoriaService, Categoria } from '../categorias/categoria';
import { MovimientoInventarioService } from './inventario';
import { InventarioDialog } from './inventario-dialog/inventario-dialog';
import { ProductoDialog } from '../productos/producto-dialog/producto-dialog';
import { ImagePreviewDialog } from '../shared/image-preview-dialog';
import { ToastService } from '../shared/toast.service';
import { AuthService } from '../auth/auth';

@Component({
  selector: 'app-inventarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatInputModule
  ],
  template: `
    <mat-card class="header-card">
      <div class="header-content" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div class="title-group">
          <h1>Inventario de Productos</h1>
          <p>Control de stock, precios y referencias de tus accesorios MajoKids - {{ productos().length }} productos en total</p>
        </div>
        <div class="actions-group" style="display: flex; gap: 16px; align-items: center;">
          <mat-form-field appearance="outline" class="categoria-filter">
            <mat-label>Filtrar por Categoría</mat-label>
            <mat-select (selectionChange)="categoriaSeleccionada.set($event.value)">
              <mat-option [value]="null">Todas ({{ productos().length }})</mat-option>
              <mat-option *ngFor="let cat of categorias()" [value]="cat.id">
                {{ cat.nombre }} ({{ getCantidadPorCategoria(cat.id) }})
              </mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-fab color="primary" (click)="abrirDialogoProducto()" style="margin-top: -15px;" title="Nuevo Producto" *ngIf="isAdmin() || isJefe()">
            <mat-icon>add</mat-icon>
          </button>
        </div>
      </div>
    </mat-card>

    <mat-card class="luxury-card search-bar-card">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Buscar por nombre o referencia...</mat-label>
        <input matInput [ngModel]="terminoBusqueda()" (ngModelChange)="terminoBusqueda.set($event)" placeholder="Ej: Moño, MK-001...">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>
      <span class="results-count" *ngIf="terminoBusqueda()">
        {{ productosFiltrados().length }} resultado(s) encontrado(s)
      </span>
    </mat-card>

    <mat-card class="luxury-card">
      <mat-card-content>
        <table mat-table [dataSource]="productosFiltrados()" class="full-width">
          <ng-container matColumnDef="referencia">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Referencia </th>
            <td mat-cell *matCellDef="let p" class="text-center"> 
              <span class="ref-text">{{p.referencia}}</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Nombre </th>
            <td mat-cell *matCellDef="let p">
              <div class="prod-cell">
                <img *ngIf="p.imagenUrl" [src]="p.imagenUrl" class="thumb" (click)="abrirImagen(p.imagenUrl)" matTooltip="Ver foto ampliada">
                <mat-icon *ngIf="!p.imagenUrl" class="thumb-placeholder">image</mat-icon>
                <span>{{p.nombre}}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="categoria">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Categoría </th>
            <td mat-cell *matCellDef="let p" class="text-center"> 
              <mat-chip-set>
                <mat-chip [class]="getCategoriaClass(p.categoriaNombre)">{{p.categoriaNombre || 'Sin Categoría'}}</mat-chip>
              </mat-chip-set>
            </td>
          </ng-container>

          <ng-container matColumnDef="precio">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Precio </th>
            <td mat-cell *matCellDef="let p" class="text-center"> {{p.precioVenta | currency:'COP':'symbol':'1.0-0'}} </td>
          </ng-container>

          <ng-container matColumnDef="stock">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Stock </th>
            <td mat-cell *matCellDef="let p" class="text-center">
              <span [class.stock-low]="p.stockActual <= 5">
                {{p.stockActual}}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Estado </th>
            <td mat-cell *matCellDef="let p" class="text-center">
              <span *ngIf="p.stockActual <= 0" class="status-out-of-stock">Agotado</span>
              <span *ngIf="p.stockActual > 0" [class.status-active]="p.activo" [class.status-inactive]="!p.activo">
                {{ p.activo ? 'Disponible' : 'Inactivo' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Acciones </th>
            <td mat-cell *matCellDef="let p" class="text-center">
              <div class="action-buttons-group">
                <button mat-stroked-button color="primary" (click)="abrirDialogoMovimiento(p)">
                  <mat-icon>inventory_2</mat-icon> Ingresar Stock
                </button>
                <button mat-stroked-button color="accent" (click)="abrirDialogoProducto(p)">
                  <mat-icon>edit_note</mat-icon> Editar Producto
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns();"></tr>
        </table>

        <div *ngIf="loading" class="loading-state">
          Cargando inventario...
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header-container h1 {
      margin: 0;
      font-weight: 800;
      color: var(--dark-text);
    }
    .categoria-filter {
      width: 300px;
    }
    .search-bar-card {
      margin-bottom: 16px;
      padding: 12px 16px 0 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .search-field {
      flex: 1;
      width: 100%;
    }
    .results-count {
      font-size: 13px;
      color: var(--primary-pink);
      font-weight: 600;
      white-space: nowrap;
    }
    ::ng-deep .categoria-filter .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }
    .luxury-card {
      border-radius: 20px;
      box-shadow: var(--luxury-shadow);
      border: 1px solid var(--border-color);
      overflow: hidden;
    }
    .full-width {
      width: 100%;
    }
    .stock-low {
      color: #f44336;
      font-weight: 700;
      background: #ffebee;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .status-out-of-stock {
      background: #fff3e0;
      color: #ef6c00;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      border: 1px solid #ffe0b2;
    }
    .status-active {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }
    .status-inactive {
      background: #fafafa;
      color: #9e9e9e;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }
    .loading-state {
      padding: 40px;
      text-align: center;
      color: var(--subtle-text);
    }
    ::ng-deep th.mat-mdc-header-cell {
      background: var(--bg-main) !important;
      color: var(--primary-pink) !important;
      font-weight: 800 !important;
      text-align: center !important;
      font-size: 15px !important;
    }
    .text-center { text-align: center !important; }
    ::ng-deep .mat-mdc-chip-set { justify-content: center; }
    code {
      background: #f5f5f5;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'JetBrains Mono', monospace;
    }
    .prod-cell { display: flex; align-items: center; gap: 10px; }
    .thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; cursor: pointer; transition: transform 0.2s; border: 1px solid #eee; }
    .thumb:hover { transform: scale(1.1); box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .thumb-placeholder { width: 40px; height: 40px; font-size: 40px; color: #ccc; }
    .cat-nina { background-color: #ec407a !important; color: #ffffff !important; font-weight: 800 !important; border: 1px solid #d81b60; }
    .cat-mujer { background-color: #7b1fa2 !important; color: #ffffff !important; font-weight: 700 !important; }
    .cat-nino { background-color: #03a9f4 !important; color: #ffffff !important; font-weight: 700 !important; }
    .cat-hombre { background-color: #0d47a1 !important; color: #ffffff !important; font-weight: 700 !important; }
    .ref-text { 
      color: var(--primary-pink);
      font-weight: 700;
      letter-spacing: 0.5px;
      font-family: inherit;
      font-size: 15px;
    }
    .action-buttons-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .action-buttons-group button { min-width: 140px; font-weight: 600; letter-spacing: 0.5px; border-width: 2px; }
  `]
})
export class Inventarios implements OnInit {
  private productoService = inject(ProductoService);
  private inventarioService = inject(MovimientoInventarioService);
  private categoriaService = inject(CategoriaService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  productos = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  categoriaSeleccionada = signal<number | null>(null);

  terminoBusqueda = signal<string>('');

  productosFiltrados = computed(() => {
    const prods = this.productos();
    const catId = this.categoriaSeleccionada();
    const term = this.terminoBusqueda().toLowerCase().trim();

    return prods.filter(p => {
      const pasaCategoria = (catId === null || catId === undefined)
        ? true
        : (p.categoriaId ?? p.categoria?.id) == catId;

      const pasaBusqueda = term.length < 2
        ? true
        : (p.nombre?.toLowerCase().includes(term) || p.referencia?.toLowerCase().includes(term));

      return pasaCategoria && pasaBusqueda;
    });
  });

  onBusquedaChange(value: string) {
    this.terminoBusqueda.set(value);
  }

  getCategoriaClass(nombre: string | undefined): string {
    if (!nombre) return '';
    const n = nombre.toLowerCase();
    if (n.includes('niña')) return 'cat-nina';
    if (n.includes('mujer')) return 'cat-mujer';
    if (n.includes('niño')) return 'cat-nino';
    if (n.includes('hombre')) return 'cat-hombre';
    return '';
  }

  getCantidadPorCategoria(catId: number | undefined): number {
    if (catId === undefined) return 0;
    return this.productos().filter(p => {
      const pCatId = p.categoriaId ?? p.categoria?.id;
      return pCatId == catId;
    }).length;
  }

  loading = false;
  
  displayedColumns = computed(() => {
    const columns = ['referencia', 'nombre', 'categoria', 'precio', 'stock', 'estado'];
    if (this.isAdmin() || this.isJefe()) {
      columns.push('acciones');
    }
    return columns;
  });

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isJefe(): boolean {
    return this.authService.isJefe();
  }


  ngOnInit() {
    this.cargarCategorias();
    this.cargarProductos();
  }

  cargarCategorias() {
    this.categoriaService.obtenerTodas().subscribe({
      next: (data) => this.categorias.set(data),
      error: () => console.error('Error al cargar categorías')
    });
  }

  cargarProductos() {
    this.loading = true;
    this.productoService.obtenerTodos().subscribe({
      next: (data) => {
        this.productos.set(data);
        this.loading = false;
      },
      error: () => {
        this.toast.error('No se pudo cargar el inventario.', 'Error');
        this.loading = false;
      }
    });
  }

  abrirImagen(url: string) {
    if (!url) return;
    this.dialog.open(ImagePreviewDialog, {
      data: url,
      panelClass: 'image-preview-dialog-panel',
      maxWidth: '90vw',
      maxHeight: '90vh'
    });
  }

  abrirDialogoMovimiento(producto: Producto) {
    const dialogRef = this.dialog.open(InventarioDialog, {
      width: '400px',
      data: { producto }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.inventarioService.registrarMovimiento(result).subscribe({
          next: () => {
            this.toast.success('El stock se ha actualizado correctamente.', 'Movimiento registrado');
            this.cargarProductos();
          },
          error: (err) => {
            this.toast.error(err.error?.message || 'No se pudo registrar el movimiento', 'Error');
          }
        });
      }
    });
  }

  abrirDialogoProducto(producto?: Producto) {
    const dialogRef = this.dialog.open(ProductoDialog, {
      width: '500px',
      data: producto || null
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (producto?.id) {
          this.productoService.actualizar(producto.id, result).subscribe({
            next: () => {
              this.toast.success(`Los cambios en ${result.nombre} se han guardado.`, 'Producto actualizado');
              this.cargarProductos();
            },
            error: (err) => {
              const msg = err.error?.message || err.error || 'No se pudo actualizar el producto';
              this.toast.error(msg, 'Error');
            }
          });
        } else {
          this.productoService.crear(result).subscribe({
            next: (nuevo) => {
              this.toast.success(`El producto ${nuevo.nombre} ya está en el inventario.`, 'Producto creado');
              this.cargarProductos();
            },
            error: (err) => {
              const msg = err.error?.message || err.error || 'No se pudo crear el producto';
              this.toast.error(msg, 'Error');
            }
          });
        }
      }
    });
  }
}
