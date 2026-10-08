import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { ProductoService, Producto } from '../productos/producto';
import { VentaService } from './venta';
import { MetodoPagoService, MetodoPago } from './metodo-pago';
import { AuthService } from '../auth/auth';
import { SesionTrabajoService, SesionTrabajo } from '../sesiones-trabajo/sesion-trabajo';
import { UsuarioService, Usuario } from '../usuarios/usuario';
import { SuccessDialog } from '../shared/success-dialog';
import { ToastService } from '../shared/toast.service';
import { ImagePreviewDialog } from '../shared/image-preview-dialog';
import { ResumenCierreDialog } from '../sesiones-trabajo/sesiones-trabajo';


interface ItemCarrito extends Producto {
  cantidadVenta: number;
  precioUnitario: number;
}

@Component({
  selector: 'app-venta-historial-dialog',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatDatepickerModule, MatNativeDateModule, MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  template: `
    <div class="historial-wrapper">
      <h2 mat-dialog-title>Historial de Ventas</h2>
      
      <div class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Desde</mat-label>
          <input matInput [matDatepicker]="picker1" [formControl]="fechaInicio">
          <mat-datepicker-toggle matSuffix [for]="picker1"></mat-datepicker-toggle>
          <mat-datepicker #picker1></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Hasta</mat-label>
          <input matInput [matDatepicker]="picker2" [formControl]="fechaFin">
          <mat-datepicker-toggle matSuffix [for]="picker2"></mat-datepicker-toggle>
          <mat-datepicker #picker2></mat-datepicker>
        </mat-form-field>

        <button mat-flat-button color="primary" (click)="buscar()" [disabled]="loading">
          <mat-icon>search</mat-icon> Buscar
        </button>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="ventas()" class="full-width">
          <ng-container matColumnDef="factura">
            <th mat-header-cell *matHeaderCellDef> Factura </th>
            <td mat-cell *matCellDef="let v"> {{v.numeroFactura}} </td>
          </ng-container>

          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef> Fecha </th>
            <td mat-cell *matCellDef="let v"> {{v.createdAt | date:'short'}} </td>
          </ng-container>

          <ng-container matColumnDef="total">
            <th mat-header-cell *matHeaderCellDef> Total </th>
            <td mat-cell *matCellDef="let v"> {{v.total | currency:'COP' : 'symbol' : '1.0-0'}} </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef> - </th>
            <td mat-cell *matCellDef="let v">
              <button mat-icon-button color="accent" (click)="seleccionar(v)">
                <mat-icon>edit</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="['factura', 'fecha', 'total', 'acciones']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['factura', 'fecha', 'total', 'acciones'];"></tr>
        </table>
        <div *ngIf="ventas().length === 0 && !loading" class="empty">No hay ventas en este rango.</div>
        <div *ngIf="loading" class="empty">Cargando...</div>
      </div>
    </div>
  `,
  styles: [`
    .historial-wrapper { padding: 20px; max-height: 80vh; display: flex; flex-direction: column; }
    .filters { display: flex; gap: 10px; align-items: baseline; margin-bottom: 20px; }
    .table-container { flex: 1; overflow-y: auto; min-height: 300px; }
    .empty { text-align: center; padding: 40px; color: #999; }
    ::ng-deep .mat-mdc-dialog-content { max-height: none !important; }
  `]
})
export class VentaHistorialDialog implements OnInit {
  private ventaService = inject(VentaService);
  dialogRef = inject(MatDialogRef<VentaHistorialDialog>);
  
  fechaInicio = new FormControl(new Date());
  fechaFin = new FormControl(new Date());
  ventas = signal<any[]>([]);
  loading = false;

  ngOnInit() {
    this.buscar();
  }

  buscar() {
    if (!this.fechaInicio.value || !this.fechaFin.value) return;
    
    this.loading = true;
    const inicio = new Date(this.fechaInicio.value);
    inicio.setHours(0,0,0,0);
    const fin = new Date(this.fechaFin.value);
    fin.setHours(23,59,59,999);

    this.ventaService.obtenerPorRango(this.fechaLocal(inicio), this.fechaLocal(fin)).subscribe({
      next: (res) => {
        this.ventas.set(res);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  private fechaLocal(d: Date): string {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${da}`;
  }

  seleccionar(venta: any) {
    this.dialogRef.close(venta);
  }
}

@Component({
  selector: 'app-venta',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatDividerModule,
    MatSelectModule,
    MatDialogModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule
  ],
  template: `
    <div class="venta-grid" *ngIf="sesionActiva() || isAdmin(); else cajaCerrada">
      <!-- Sección Izquierda: Buscador y Carrito -->
      <div class="pos-section">
        <mat-card class="pink-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">search</mat-icon>
            <mat-card-title>Buscador de Accesorios</mat-card-title>
            <span class="spacer"></span>
            <button mat-stroked-button color="primary" *ngIf="isAdmin()" (click)="abrirHistorial()" style="margin-right: 8px;">
              <mat-icon>history</mat-icon> Historial / Editar
            </button>
          </mat-card-header>
          
          <mat-card-content>
            <div class="search-bar">
              <mat-form-field appearance="outline" class="flex-grow">
                <mat-label>Buscador de Productos (Nombre o Referencia)</mat-label>
                <input matInput 
                       [formControl]="searchControl"
                       [matAutocomplete]="auto"
                       placeholder="Ej: Moño, MK-001...">
                <mat-icon matSuffix>search</mat-icon>
                
                <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onProductSelected($event)">
                  <mat-option 
                    *ngFor="let producto of productosFiltrados()" 
                    [value]="producto"
                    [disabled]="producto.stockActual <= 0"
                    [class.sin-stock]="producto.stockActual <= 0">
                    <div class="product-option">
                      <span class="prod-name">{{producto.referencia}}</span>
                      <span class="prod-ref">{{producto.nombre}}</span>
                      <span class="prod-price">{{producto.precioVenta | currency:'COP' : 'symbol' : '1.0-0'}}</span>
                      <span class="stock-badge" [class.badge-ok]="producto.stockActual > 5" [class.badge-low]="producto.stockActual > 0 && producto.stockActual <= 5" [class.badge-empty]="producto.stockActual <= 0">
                        {{ producto.stockActual <= 0 ? 'Sin stock' : 'Stock: ' + producto.stockActual }}
                      </span>
                    </div>
                  </mat-option>
                </mat-autocomplete>
              </mat-form-field>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="pink-card margin-top">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">shopping_bag</mat-icon>
            <mat-card-title>Carrito de Ventas</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <table mat-table [dataSource]="carrito()" class="full-width">
              <ng-container matColumnDef="producto">
                <th mat-header-cell *matHeaderCellDef> Producto </th>
                <td mat-cell *matCellDef="let item">
                  <div class="prod-cell">
                    <img *ngIf="item.imagenUrl" [src]="item.imagenUrl" class="cart-thumb" (click)="abrirImagen(item.imagenUrl)" matTooltip="Ver foto ampliada">
                    <mat-icon *ngIf="!item.imagenUrl" class="cart-thumb-placeholder">image</mat-icon>
                    <span>{{item.nombre}}</span>
                  </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="precio">
                <th mat-header-cell *matHeaderCellDef> Precio </th>
                <td mat-cell *matCellDef="let item"> 
                  <mat-form-field appearance="outline" subscriptSizing="dynamic" style="width: 130px;">
                    <span matPrefix>$</span>
                    <input matInput type="number" min="0" [(ngModel)]="item.precioUnitario" (ngModelChange)="calcularTotal()">
                  </mat-form-field>
                </td>
              </ng-container>

              <ng-container matColumnDef="cantidad">
                <th mat-header-cell *matHeaderCellDef> Cant. </th>
                <td mat-cell *matCellDef="let item"> 
                   <div class="qty-control">
                     <button mat-icon-button (click)="modificarCantidad(item, -1)"><mat-icon>remove_circle_outline</mat-icon></button>
                     <span>{{item.cantidadVenta}}</span>
                     <button mat-icon-button (click)="modificarCantidad(item, 1)"><mat-icon>add_circle_outline</mat-icon></button>
                   </div>
                </td>
              </ng-container>

              <ng-container matColumnDef="subtotal">
                <th mat-header-cell *matHeaderCellDef> Subtotal </th>
                <td mat-cell *matCellDef="let item"> {{ (item.precioUnitario * item.cantidadVenta) | currency:'COP' : 'symbol' : '1.0-0'}} </td>
              </ng-container>

              <ng-container matColumnDef="acciones">
                <th mat-header-cell *matHeaderCellDef> - </th>
                <td mat-cell *matCellDef="let item">
                   <button mat-icon-button color="warn" (click)="eliminarItem(item)">
                     <mat-icon>delete_forever</mat-icon>
                   </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <div *ngIf="carrito().length === 0" class="empty-cart">
              <mat-icon>shopping_cart_checkout</mat-icon>
              <p>El carrito está vacío</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Sección Derecha: Resumen de Pago -->
      <div class="summary-section">
        <mat-card class="total-card">
          <mat-card-content>
            <div class="total-row">
              <span class="label">{{ editMode() ? 'Editando Factura' : 'Total a Pagar' }}</span>
              <span class="value" *ngIf="!editMode()">{{ calcularTotal() | currency:'COP' : 'symbol' : '1.0-0' }}</span>
              <span class="edit-factura" *ngIf="editMode()">{{ facturaEnEdicion() }}</span>
            </div>
            <div class="total-row" *ngIf="editMode()">
               <span class="label">Nuevo Total</span>
               <span class="value">{{ calcularTotal() | currency:'COP' : 'symbol' : '1.0-0' }}</span>
            </div>
            <mat-divider></mat-divider>
            <div class="items-count">
              <span>{{ carrito().length }} productos en el carrito</span>
            </div>

            <h3 class="payment-title">Seleccionar Método de Pago</h3>
            <mat-form-field appearance="outline" class="payment-select">
              <mat-select [(ngModel)]="metodoPagoSeleccionado">
                <mat-option *ngFor="let mp of metodosPago" [value]="mp.id">
                  <span class="dark-option-text">{{mp.nombre}}</span>
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Calculadora de Pago en Efectivo -->
            <div class="cash-section" *ngIf="metodoSeleccionadoEsEfectivo()">
              <h3 class="payment-title">¿Con cuánto paga el cliente?</h3>
              <mat-form-field appearance="outline" class="cash-input">
                <span matPrefix>$&nbsp;</span>
                <input matInput type="number" min="0" [(ngModel)]="efectivoRecibido" placeholder="Digite aquí el monto">
              </mat-form-field>

              <div class="quick-amounts-label" *ngIf="montosRapidos().length > 0">O escoja el monto:</div>
              <div class="quick-amounts" *ngIf="montosRapidos().length > 0">
                <button mat-stroked-button type="button" class="quick-amount-btn"
                        *ngFor="let m of montosRapidos()"
                        [class.selected]="efectivoRecibido === m"
                        (click)="efectivoRecibido = m">
                  {{ m | currency:'COP' : 'symbol' : '1.0-0' }}
                </button>
              </div>

              <div class="change-box" *ngIf="recibidoNumerico() > 0"
                   [class.insufficient]="cambioADevolver() < 0">
                <span class="change-label">{{ cambioADevolver() >= 0 ? 'CAMBIO A DEVOLVER' : '¡OJO! FALTA PLATA' }}</span>
                <span class="change-value">{{ valorCambio() | currency:'COP' : 'symbol' : '1.0-0' }}</span>
                <span class="change-hint" *ngIf="cambioADevolver() >= 0">Recibido: {{ recibidoNumerico() | currency:'COP' : 'symbol' : '1.0-0' }} — Total: {{ calcularTotal() | currency:'COP' : 'symbol' : '1.0-0' }}</span>
              </div>
            </div>

            <!-- Fecha Histórica (Solo Administradores) -->
            <div *ngIf="isAdmin()" style="margin-top: 15px; margin-bottom: 15px;">
              <h3 class="payment-title" style="color: #333333;">Fecha Histórica</h3>
              <mat-form-field appearance="outline" style="width: 100%;">
                <mat-label>Seleccionar Fecha</mat-label>
                <input matInput [matDatepicker]="pickerVenta" [formControl]="fechaHistorica">
                <mat-datepicker-toggle matIconSuffix [for]="pickerVenta"></mat-datepicker-toggle>
                <mat-datepicker #pickerVenta panelClass="pink-datepicker"></mat-datepicker>
                <mat-hint>Dejar vacío para registrar con fecha actual</mat-hint>
              </mat-form-field>

              <h3 class="payment-title" style="color: #333333;">Asignar a Vendedor</h3>
              <mat-form-field appearance="outline" style="width: 100%;">
                <mat-label>Seleccionar Vendedor</mat-label>
                <mat-select [formControl]="vendedorSeleccionado">
                  <mat-option *ngFor="let u of usuarios()" [value]="u.id">
                    <span class="dark-option-text">{{u.nombre}} ({{u.rolNombre}})</span>
                  </mat-option>
                </mat-select>
                <mat-hint>Si se deja vacío, se asignará a tu sesión actual</mat-hint>
              </mat-form-field>
            </div>

            
            <button mat-raised-button class="checkout-btn" 
                    [disabled]="carrito().length === 0 || loading || !metodoPagoSeleccionado"
                    (click)="finalizarVenta()">
              <mat-icon>{{ editMode() ? 'save' : 'check_circle' }}</mat-icon>
              {{ loading ? 'Procesando...' : (editMode() ? 'GUARDAR CAMBIOS' : 'FINALIZAR VENTA') }}
            </button>

            <button mat-button class="cancel-edit-btn" *ngIf="editMode()" (click)="cancelarEdicion()">
               <mat-icon>close</mat-icon> Cancelar Edición
            </button>

            <mat-divider style="margin: 20px 0;"></mat-divider>

            <button mat-raised-button class="close-box-btn" 
                    *ngIf="sesionActiva()"
                    (click)="cerrarCajaDirecto()">
              <mat-icon>power_settings_new</mat-icon>
              CERRAR CAJA Y TURNO
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    <!-- PANTALLA DE BLOQUEO: CAJA CERRADA -->
    <ng-template #cajaCerrada>
      <div class="lock-screen" *ngIf="!checkingSession">
        <mat-card class="lock-card">
          <mat-card-content>
            <mat-icon class="lock-icon">lock</mat-icon>
            <h2>Caja Cerrada</h2>
            <p>Por seguridad, no puedes realizar ventas si tu turno no está activo.</p>
            <p>Debes abrir tu caja antes de registrar movimientos de dinero.</p>
            
            <div class="lock-actions">
              <button mat-raised-button color="primary" class="quick-open-btn" (click)="abrirCajaDirecto()" [disabled]="loading">
                <mat-icon>play_circle</mat-icon>
                {{ loading ? 'Abriendo...' : 'ABRIR CAJA AHORA' }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
      <div class="lock-screen" *ngIf="checkingSession">
        <mat-card class="lock-card">
          <p>Verificando estado de la caja...</p>
        </mat-card>
      </div>
    </ng-template>
  `,
  styles: [`
    .venta-grid {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 20px;
    }
    .pink-card {
      border-radius: 20px;
      border: 1px solid var(--border-color);
      background: var(--bg-card);
      box-shadow: var(--luxury-shadow);
    }
    .total-card {
      background: #ffffff;
      color: #333333;
      border-radius: 36px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
      border: 1px solid #e0e0e0;
    }
    .total-row {
      display: flex;
      flex-direction: column;
      padding: 25px 0;
    }
    .total-row .label { font-size: 14px; opacity: 0.9; }
    .total-row .value { font-size: 48px; font-weight: 800; color: var(--primary-pink); }
    .edit-factura { font-size: 20px; font-weight: 800; color: #333; margin-top: 5px; }
    
    .checkout-btn {
      width: 100%;
      height: 65px;
      margin-top: 25px;
      background: var(--primary-pink) !important;
      color: white !important;
      font-weight: 800;
      font-size: 20px;
      border-radius: 18px;
      box-shadow: 0 4px 15px rgba(216, 27, 96, 0.3);
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .payment-title {
      font-size: 16px;
      font-weight: 700;
      color: #333333;
      text-align: left;
      margin-top: 25px;
      margin-bottom: 8px;
      padding-left: 10px;
    }
    .payment-select { width: 100%; margin-top: 0; }
    ::ng-deep .dark-option-text { color: #333333 !important; font-weight: 600; }
    ::ng-deep mat-datepicker-toggle,
    ::ng-deep .mat-datepicker-toggle,
    ::ng-deep mat-datepicker-toggle button,
    ::ng-deep mat-datepicker-toggle mat-icon,
    ::ng-deep .mat-datepicker-toggle-default-icon { color: var(--primary-pink) !important; }

    ::ng-deep .pink-datepicker { background: #ffffff !important; border-radius: 12px; overflow: hidden; box-shadow: 0 5px 20px rgba(0,0,0,0.2) !important; }
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

    
    .search-bar { display: flex; align-items: baseline; }
    .flex-grow { flex-grow: 1; }
    .margin-left { margin-left: 15px; }
    .margin-top { margin-top: 20px; }
    .full-width { width: 100%; }
    .qty-control { display: flex; align-items: center; gap: 5px; }
    .empty-cart { padding: 40px; text-align: center; color: var(--dark-pink); opacity: 0.5; }
    .empty-cart mat-icon { font-size: 64px; width: 64px; height: 64px; }
    
    ::ng-deep table.mat-mdc-table { background: transparent !important; }
    ::ng-deep table.mat-mdc-table thead tr { background-color: #fff5f8 !important; }
    ::ng-deep th.mat-mdc-header-cell {
      color: var(--primary-pink) !important; font-weight: 700 !important;
      text-transform: uppercase; font-size: 12px; letter-spacing: 1px;
    }
    ::ng-deep td.mat-mdc-cell { color: var(--dark-text) !important; font-size: 15px; }
    .qty-control span { font-weight: 700; color: var(--primary-pink); min-width: 25px; text-align: center; }
    .prod-cell { display: flex; align-items: center; gap: 10px; }
    .cart-thumb { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; cursor: pointer; transition: transform 0.2s; border: 1px solid #eee; }
    .cart-thumb:hover { transform: scale(1.1); box-shadow: 0 4px 10px rgba(0,0,0,0.15); }
    .cart-thumb-placeholder { width: 40px; height: 40px; font-size: 40px; color: #ccc; }
    .product-option { display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 10px; }
    .prod-name { font-weight: 600; flex: 1; color: #333333 !important; }
    .prod-ref { font-family: monospace; color: var(--subtle-text); font-size: 12px; }
    .prod-price { color: var(--primary-pink); font-weight: 700; }
    .stock-badge { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 20px; white-space: nowrap; }
    .badge-ok { background: #e8f5e9; color: #2e7d32; }
    .badge-low { background: #fff8e1; color: #f57f17; }
    .badge-empty { background: #ffebee; color: #c62828; }
    ::ng-deep .sin-stock { opacity: 0.5 !important; text-decoration: line-through !important; cursor: not-allowed !important; }

    /* Estilos Pantalla Bloqueo */
    .lock-screen {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 70vh;
    }
    .lock-card {
      text-align: center;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      max-width: 400px;
    }
    .lock-icon { font-size: 80px; width: 80px; height: 80px; color: #999; margin-bottom: 20px; }
    .lock-card h2 { font-weight: 800; color: #333; margin-bottom: 10px; }
    .lock-card p { color: #666; margin-bottom: 5px; }
    .lock-actions { margin-top: 30px; display: flex; flex-direction: column; gap: 10px; }
    .quick-open-btn { padding: 25px !important; font-weight: 800; border-radius: 12px; font-size: 16px; letter-spacing: 1px; }

    .lock-card {
      max-width: 450px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.1);
      border-top: 8px solid var(--primary-pink);
    }
    .lock-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #f44336;
      margin-bottom: 20px;
    }
    .lock-card h2 {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 10px;
    }
    .lock-card p {
      color: #666;
      font-size: 16px;
      line-height: 1.5;
    }
    .open-box-btn {
      margin-top: 30px;
      padding: 25px 40px;
      font-size: 18px;
      border-radius: 12px;
      font-weight: bold;
    }
    
    .close-box-btn {
      width: 100%;
      background-color: #f44336 !important;
      color: white !important;
      padding: 25px 0 !important;
      font-size: 16px;
      border-radius: 12px;
      font-weight: bold;
      margin-top: 10px;
    }

    .spacer { flex: 1 1 auto; }
    .cancel-edit-btn { width: 100%; margin-top: 10px; color: #666; }

    /* Calculadora de Efectivo */
    .cash-section { margin-top: 15px; text-align: left; }
    .cash-input { width: 100%; margin-top: 0; }
    ::ng-deep .cash-input input { font-size: 24px !important; font-weight: 800; text-align: center; color: #333; }
    /* El placeholder debe verse SIEMPRE en este campo (anula la regla global de styles.css que lo oculta en reposo) */
    ::ng-deep .cash-input.mat-mdc-form-field:not(.mat-mdc-form-field-should-float) .mat-mdc-input-element::placeholder,
    ::ng-deep .cash-input .mat-mdc-input-element::placeholder {
      color: #b5b5b5 !important;
      opacity: 1 !important;
      -webkit-text-fill-color: #b5b5b5 !important;
      font-size: 16px;
      font-weight: 600;
    }
    ::ng-deep .cash-input .mat-mdc-form-field-subscript-wrapper { display: none; }
    .quick-amounts-label {
      margin-top: 14px;
      font-size: 14px;
      font-weight: 700;
      color: #666;
      padding-left: 4px;
    }
    .quick-amounts { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }
    .quick-amount-btn {
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      color: var(--primary-pink) !important;
      border-color: #f3c1d4 !important;
    }
    .quick-amount-btn.selected {
      background: #fce4ec !important;
      border-color: var(--primary-pink) !important;
    }
    .change-box {
      margin-top: 14px;
      padding: 14px 10px;
      border-radius: 16px;
      background: #e8f5e9;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }
    .change-label { font-size: 13px; font-weight: 800; letter-spacing: 1px; color: #2e7d32; }
    .change-value { font-size: 38px; font-weight: 800; color: #2e7d32; line-height: 1.1; }
    .change-hint { font-size: 11px; color: #55775a; margin-top: 4px; }
    .change-box.insufficient { background: #ffebee; }
    .change-box.insufficient .change-label,
    .change-box.insufficient .change-value { color: #c62828; }
  `]
})
export class Ventas implements OnInit {
  searchControl = new FormControl('');
  fechaHistorica = new FormControl<Date | null>(null);
  vendedorSeleccionado = new FormControl<number | null>(null);
  loading = false;
  checkingSession = true;
  
  productosFiltrados = signal<Producto[]>([]);
  carrito = signal<ItemCarrito[]>([]);
  sesionActiva = signal<SesionTrabajo | null>(null);
  usuarios = signal<Usuario[]>([]);
  editMode = signal(false);
  facturaEnEdicion = signal('');
  ventaIdEnEdicion = signal<number | null>(null);
  displayedColumns: string[] = ['producto', 'precio', 'cantidad', 'subtotal', 'acciones'];

  private productoService = inject(ProductoService);
  private ventaService = inject(VentaService);
  private metodoPagoService = inject(MetodoPagoService);
  private authService = inject(AuthService);
  private sesionService = inject(SesionTrabajoService);
  private usuarioService = inject(UsuarioService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private dialog = inject(MatDialog);

  metodosPago: MetodoPago[] = [];
  metodoPagoSeleccionado = 1;
  efectivoRecibido: number | null = null;

  metodoSeleccionadoEsEfectivo(): boolean {
    const mp = this.metodosPago.find(m => m.id === this.metodoPagoSeleccionado);
    return !!mp && mp.nombre.toLowerCase().includes('efectivo');
  }

  recibidoNumerico(): number {
    const r = Number(this.efectivoRecibido);
    return isFinite(r) && r > 0 ? r : 0;
  }

  cambioADevolver(): number {
    return this.recibidoNumerico() - this.calcularTotal();
  }

  valorCambio(): number {
    return Math.abs(this.cambioADevolver());
  }

  // Botones rápidos según billetes colombianos: monto exacto + billetes que cubren el total
  // (los clientes suelen pagar con 50.000 o 100.000 aunque la compra sea pequeña)
  montosRapidos(): number[] {
    const total = this.calcularTotal();
    if (total <= 0) return [];
    const billetes = [1000, 2000, 5000, 10000, 20000, 50000, 100000];
    const montos = new Set<number>([total]);
    billetes.forEach(b => {
      if (b >= total) montos.add(b);
    });
    return Array.from(montos).sort((a, b) => a - b).slice(0, 6);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit() {
    this.verificarCajaFuerte();

    // Configurar búsqueda dinámica
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value === 'string' && value.length >= 2) {
          return this.productoService.buscar(value);
        }
        return of([]);
      })
    ).subscribe(productos => {
      this.productosFiltrados.set(productos);
    });

    this.metodoPagoService.obtenerTodos().subscribe(res => {
      this.metodosPago = res;
      if (res.length > 0) this.metodoPagoSeleccionado = res[0].id;
    });

    if (this.isAdmin()) {
      this.usuarioService.obtenerTodos().subscribe(users => {
        this.usuarios.set(users.filter(u => u.activo));
      });
    }
  }

  verificarCajaFuerte() {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.checkingSession = false;
      return;
    }

    this.sesionService.obtenerSesionActiva(userId).subscribe({
      next: (sesion) => {
        this.sesionActiva.set(sesion);
        this.checkingSession = false;
      },
      error: () => {
        // Caja cerrada, se queda en null
        this.sesionActiva.set(null);
        this.checkingSession = false;
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

  onProductSelected(event: any) {
    const producto = event.option.value as Producto;
    this.agregarAlCarrito(producto);
    this.searchControl.setValue('', { emitEvent: false });
    this.productosFiltrados.set([]);
  }

  agregarAlCarrito(producto: Producto) {
    // BLOQUEO: No permitir agregar productos sin stock
    if (producto.stockActual <= 0) {
      this.toast.warning(`"${producto.nombre}" no tiene stock disponible.`, 'Sin stock');
      return;
    }

    const actual = this.carrito();
    const index = actual.findIndex(p => p.id === producto.id);
    let nuevaCant = 1;
    
    if (index >= 0) {
      // BLOQUEO: No superar el stock disponible
      if (actual[index].cantidadVenta >= producto.stockActual) {
        this.toast.warning(`No puedes agregar más de ${producto.stockActual} unidades de "${producto.nombre}".`, 'Límite de stock');
        return;
      }
      actual[index].cantidadVenta += 1;
      nuevaCant = actual[index].cantidadVenta;
      this.carrito.set([...actual]);
    } else {
      this.carrito.set([...actual, { ...producto, cantidadVenta: 1, precioUnitario: producto.precioVenta }]);
    }
    
    if (nuevaCant >= producto.stockActual) {
      this.toast.warning(`Último en stock: ${producto.nombre} (${producto.stockActual} und.)`, 'Última unidad');
    } else {
      this.toast.success(`Agregado: ${producto.nombre}`, 'Añadido al carrito', 2000);
    }
  }

  modificarCantidad(item: ItemCarrito, cambio: number) {
    const actual = this.carrito();
    const index = actual.findIndex(p => p.id === item.id);
    if (index >= 0) {
      const nuevaCant = actual[index].cantidadVenta + cambio;
      
      // BLOQUEO: No permitir superar el stock disponible
      if (cambio > 0 && actual[index].cantidadVenta >= actual[index].stockActual) {
        this.toast.warning(`Stock máximo alcanzado para "${actual[index].nombre}" (${actual[index].stockActual} und.).`, 'Límite de stock');
        return;
      }

      if (nuevaCant > 0) {
        actual[index].cantidadVenta = nuevaCant;
        this.carrito.set([...actual]);
        
        if (nuevaCant === actual[index].stockActual && cambio > 0) {
          this.toast.warning(`"${actual[index].nombre}" llegó al límite del stock (${actual[index].stockActual} und.).`, 'Última unidad');
        }
      } else {
        // Si la cantidad llega a 0, remover del carrito
        this.carrito.set(actual.filter(p => p.id !== item.id));
      }
    }
  }

  eliminarItem(item: ItemCarrito) {
    this.carrito.set(this.carrito().filter(p => p.id !== item.id));
  }

  calcularTotal() {
    return this.carrito().reduce((acc, item) => acc + (item.precioUnitario * item.cantidadVenta), 0);
  }

  finalizarVenta() {
    const sesion = this.sesionActiva();
    
    // Si no es admin y no hay sesión, bloquear
    if (!this.isAdmin() && !sesion) {
      this.toast.error('Caja cerrada. Debes abrir una sesión de trabajo para vender.', 'Caja cerrada');
      return;
    }

    // Si es admin, no tiene sesión y no seleccionó vendedor, bloquear
    if (this.isAdmin() && !sesion && !this.vendedorSeleccionado.value) {
      this.toast.warning('Debes seleccionar un vendedor o abrir tu propia caja.', 'Acción requerida');
      return;
    }

    const precioInvalido = this.carrito().some(i => !isFinite(i.precioUnitario) || i.precioUnitario <= 0);
    if (precioInvalido) {
      this.toast.error('Revisa los precios del carrito: deben ser mayores a 0.', 'Precio inválido');
      return;
    }

    this.loading = true;
    
    let fhStr = undefined;
    if (this.fechaHistorica.value) {
      const d = new Date(this.fechaHistorica.value);
      const yr = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      fhStr = `${yr}-${mo}-${da}`;
    }

    const request: any = {
      metodoPagoId: this.metodoPagoSeleccionado,
      descuento: 0,
      detalles: this.carrito().map(item => ({
        productoId: item.id!,
        cantidad: item.cantidadVenta,
        precioUnitario: item.precioUnitario
      }))
    };

    if (sesion) {
      request.sesionId = sesion.id;
    }

    if (fhStr) {
      request.fechaHistorica = fhStr;
    }

    if (this.vendedorSeleccionado.value) {
      request.usuarioId = this.vendedorSeleccionado.value;
    }

    const agotados = this.carrito().filter(p => p.cantidadVenta >= p.stockActual).map(p => p.nombre);

    const obs = this.editMode() 
      ? this.ventaService.actualizarVenta(this.ventaIdEnEdicion()!, request)
      : this.ventaService.procesarVenta(request);

    obs.subscribe({
      next: () => {
        let msg = this.editMode() ? 'La venta se ha actualizado correctamente.' : 'La venta se ha registrado correctamente.';
        if (agotados.length > 0) {
          msg += ` ⚠️ ATENCIÓN: Poner en reposición: ${agotados.join(', ')}`;
        }

        this.dialog.open(SuccessDialog, {
          width: '420px',
          data: { 
            icon: '🛍️',
            title: this.editMode() ? '¡Venta Actualizada!' : '¡Venta Exitosa!', 
            message: msg 
          }
        });
        
        this.carrito.set([]);
        this.efectivoRecibido = null;
        this.loading = false;
        this.editMode.set(false);
        this.ventaIdEnEdicion.set(null);
      },
      error: (err: any) => {
        this.loading = false;
        this.toast.error('No se pudo procesar la venta: ' + (err.error?.message || 'Error del servidor'), 'Venta no registrada');
      }
    });
  }

  abrirHistorial() {
    const dialogRef = this.dialog.open(VentaHistorialDialog, {
      width: '800px'
    });

    dialogRef.afterClosed().subscribe(venta => {
      if (venta) {
        this.cargarVentaParaEdicion(venta);
      }
    });
  }

  cargarVentaParaEdicion(venta: any) {
    this.editMode.set(true);
    this.ventaIdEnEdicion.set(venta.id);
    this.facturaEnEdicion.set(venta.numeroFactura);
    this.metodoPagoSeleccionado = venta.metodoPagoId;
    this.vendedorSeleccionado.setValue(venta.usuarioId || null);
    
    const items: ItemCarrito[] = venta.detalles.map((d: any) => ({
      id: d.productoId,
      nombre: d.productoNombre,
      referencia: d.productoReferencia,
      precioVenta: d.precioUnitario,
      precioUnitario: d.precioUnitario,
      cantidadVenta: d.cantidad,
      stockActual: 999, // Para permitir editar sin bloqueo de stock inmediato
      imagenUrl: '' // No viene en el detalle resumido, opcional
    }));

    this.carrito.set(items);
    this.toast.info(`Editando factura ${venta.numeroFactura}`, 'Modo edición');
  }

  cancelarEdicion() {
    this.editMode.set(false);
    this.ventaIdEnEdicion.set(null);
    this.facturaEnEdicion.set('');
    this.carrito.set([]);
    this.efectivoRecibido = null;
    this.metodoPagoSeleccionado = this.metodosPago[0]?.id || 1;
    this.vendedorSeleccionado.setValue(null);
  }

  abrirCajaDirecto() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.loading = true;
    this.sesionService.abrirSesion(user.id).subscribe({
      next: (sesion) => {
        this.sesionActiva.set(sesion);
        this.loading = false;
        this.toast.success('Ya puedes vender.', '¡Caja abierta con éxito!');
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('No se pudo abrir la caja: ' + (err.error?.message || 'Error del servidor'), 'Error');
      }
    });
  }

  cerrarCajaDirecto() {
    const sesion = this.sesionActiva();
    if (!sesion) return;

    this.loading = true;
    this.sesionService.obtenerResumenCierre(sesion.id).subscribe({
      next: (resumen) => {
        this.loading = false;
        const dialogRef = this.dialog.open(ResumenCierreDialog, {
          width: '450px',
          disableClose: true,
          data: resumen
        });

        dialogRef.afterClosed().subscribe(confirm => {
          if (confirm) {
            this.loading = true;
            this.sesionService.cerrarSesion(sesion.id).subscribe({
              next: () => {
                this.sesionActiva.set(null);
                this.loading = false;
                this.toast.success('Caja cerrada con éxito.', '¡Caja cerrada!');
              },
              error: (err) => {
                this.loading = false;
                this.toast.error('No se pudo cerrar la caja: ' + (err.error?.message || 'Error del servidor'), 'Error');
              }
            });
          }
        });
      },
      error: (err) => {
        this.loading = false;
        this.toast.error('No se pudo obtener el resumen: ' + (err.error?.message || 'Error del servidor'), 'Error');
      }
    });
  }
}
