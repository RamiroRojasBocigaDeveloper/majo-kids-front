import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SesionTrabajoService, SesionTrabajo, ResumenCierre, VentaEfectivo } from './sesion-trabajo';
import { VentaService } from '../ventas/venta';
import { AuthService } from '../auth/auth';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-ventas-efectivo-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="dialog-wrapper">
      <div class="header-icon efectivo">
        <mat-icon>payments</mat-icon>
      </div>
      <h2 class="dialog-title">Ventas en Efectivo de Hoy</h2>
      <p class="dialog-subtitle">Productos cobrados en efectivo en esta sesión de caja.</p>

      <div *ngIf="loading()" class="loading-state">
        <mat-icon class="spin">hourglass_top</mat-icon>
        <span>Cargando detalle...</span>
      </div>

      <div *ngIf="!loading() && error()" class="error-state">
        <mat-icon>error_outline</mat-icon>
        <span>{{ error() }}</span>
      </div>

      <div *ngIf="!loading() && !error()" class="ventas-list">
        <div *ngIf="ventas().length === 0" class="empty-state">
          <mat-icon>info_outline</mat-icon>
          <span>No hubo ventas en efectivo en esta sesión.</span>
        </div>

        <div *ngFor="let venta of ventas()" class="venta-card">
          <div class="venta-header">
            <span class="factura">{{ venta.numeroFactura }}</span>
            <span class="hora">{{ (venta.fechaRegistroManual || venta.createdAt) | date:'shortTime' }}</span>
            <span class="total-venta">{{ venta.total | currency:'COP' }}</span>
          </div>
          <div class="producto-row" *ngFor="let d of venta.detalles">
            <span class="prod-nombre">{{ d.productoNombre }}</span>
            <span class="prod-cant">{{ d.cantidad }} x {{ d.precioUnitario | currency:'COP' }}</span>
            <span class="prod-subtotal">{{ (d.subtotalItem ?? d.cantidad * d.precioUnitario) | currency:'COP' }}</span>
          </div>
        </div>

        <div class="total-general" *ngIf="ventas().length > 0">
          <span>Total Efectivo</span>
          <span class="total-valor">{{ totalEfectivo() | currency:'COP' }}</span>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-flat-button color="primary" (click)="dialogRef.close()">Cerrar</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-wrapper { padding: 24px; text-align: center; }
    .header-icon { display: flex; justify-content: center; align-items: center; width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; font-size: 2rem; }
    .header-icon.efectivo { color: #2e7d32; background-color: #e8f5e9; }
    .header-icon mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .dialog-title { font-size: 1.4rem; font-weight: 800; color: #333; margin: 0 0 8px 0; }
    .dialog-subtitle { color: #666; font-size: 0.9rem; margin-bottom: 16px; }
    .ventas-list { max-height: 55vh; overflow-y: auto; text-align: left; display: flex; flex-direction: column; gap: 12px; padding-right: 4px; }
    .venta-card { background: #fafafa; border: 1px solid #eee; border-radius: 10px; padding: 12px; }
    .venta-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding-bottom: 8px; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; }
    .factura { font-weight: 700; font-size: 0.8rem; color: #555; }
    .hora { font-size: 0.8rem; color: #888; }
    .total-venta { font-weight: 800; color: #2e7d32; }
    .producto-row { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 3px 0; font-size: 0.9rem; }
    .prod-nombre { color: #444; flex: 1; }
    .prod-cant { color: #777; font-size: 0.85rem; white-space: nowrap; }
    .prod-subtotal { font-weight: 700; color: #333; white-space: nowrap; }
    .total-general { display: flex; justify-content: space-between; align-items: center; background: #e8f5e9; border-radius: 10px; padding: 12px; font-weight: 700; position: sticky; bottom: 0; }
    .total-valor { color: #2e7d32; font-size: 1.15rem; font-weight: 800; }
    .loading-state, .error-state, .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 32px 16px; color: #777; }
    .error-state { color: #c62828; }
    .error-state mat-icon, .empty-state mat-icon, .loading-state mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    .dialog-actions { display: flex; justify-content: center; margin-top: 16px; }
  `]
})
export class VentasEfectivoDialog {
  dialogRef = inject(MatDialogRef<VentasEfectivoDialog>);
  private ventaService = inject(VentaService);
  private toast = inject(ToastService);

  sesionId: number = inject(MAT_DIALOG_DATA);

  loading = signal(true);
  error = signal<string | null>(null);
  ventas = signal<VentaEfectivo[]>([]);
  totalEfectivo = signal(0);

  constructor() {
    this.ventaService.obtenerEfectivoPorSesion(this.sesionId).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (ventas) => {
        this.ventas.set(ventas);
        this.totalEfectivo.set(ventas.reduce((acc, v) => acc + (v.total || 0), 0));
      },
      error: (err) => {
        console.error('Error ventas efectivo:', err);
        const msg = err.error?.message || 'No se pudo cargar el detalle de ventas en efectivo.';
        this.error.set(msg);
        this.toast.error(msg, 'Error');
      }
    });
  }
}

@Component({
  selector: 'app-resumen-cierre-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="dialog-wrapper">
      <div class="header-icon" [ngClass]="getResultClass()">
        <mat-icon>{{ getIcon() }}</mat-icon>
      </div>
      <h2 class="dialog-title">Resumen de Cierre de Caja</h2>
      <p class="dialog-subtitle">Verifica los totales antes de confirmar el cierre.</p>

      <div class="resumen-grid">
        <div class="resumen-item">
          <span class="label">Total Ventas (Bruto)</span>
          <span class="value pos">{{ data.totalVentas | currency:'COP' }}</span>
        </div>

        <div class="desglose" *ngIf="metodosPago().length > 0">
          <span class="desglose-title">Desglose por método de pago</span>
          <div class="metodo-row" *ngFor="let m of metodosPago()">
            <span class="metodo-nombre">
              <mat-icon class="metodo-icon">{{ m.esEfectivo ? 'payments' : 'swap_horiz' }}</mat-icon>
              {{ m.nombre }}
            </span>
            <span class="metodo-valor" [class.efectivo]="m.esEfectivo">{{ m.monto | currency:'COP' }}</span>
          </div>
        </div>

        <div class="resumen-item" *ngIf="data.totalNoEfectivo > 0">
          <span class="label">Total No Efectivo (no se cuenta en caja)</span>
          <span class="value info">{{ data.totalNoEfectivo | currency:'COP' }}</span>
        </div>
        <div class="resumen-item">
          <span class="label">Total Gastos</span>
          <span class="value neg">{{ data.totalGastos | currency:'COP' }}</span>
        </div>
        <div class="divider"></div>
        <div class="resumen-item highlight" [ngClass]="getResultClass()">
          <span class="label">Efectivo Esperado en Caja</span>
          <span class="value">{{ data.efectivoEsperado | currency:'COP' }}</span>
        </div>
        <p class="hint" *ngIf="data.totalNoEfectivo > 0">
          Transferencias y consignaciones no se cuentan dentro del dinero físico de la caja.
        </p>
      </div>

      <button mat-stroked-button class="btn-detalle" *ngIf="data.totalEfectivo > 0" (click)="verVentasEnEfectivo()">
        <mat-icon>receipt_long</mat-icon>
        Ver productos vendidos en efectivo
      </button>

      <div class="dialog-actions">
        <button mat-button class="btn-cancel" (click)="dialogRef.close(false)">Cancelar</button>
        <button mat-flat-button class="btn-confirm" color="warn" (click)="dialogRef.close(true)">Cerrar Caja</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-wrapper { padding: 24px; text-align: center; }
    .header-icon { display: flex; justify-content: center; align-items: center; width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px; font-size: 2rem; }
    .header-icon mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .dialog-title { font-size: 1.5rem; font-weight: 800; color: #333; margin: 0 0 8px 0; }
    .dialog-subtitle { color: #666; font-size: 0.95rem; margin-bottom: 24px; }
    .resumen-grid { display: flex; flex-direction: column; gap: 12px; text-align: left; background: #fafafa; padding: 16px; border-radius: 12px; border: 1px solid #eee; margin-bottom: 24px; }
    .resumen-item { display: flex; justify-content: space-between; align-items: center; }
    .label { font-size: 0.95rem; color: #555; font-weight: 500; }
    .value { font-size: 1.1rem; font-weight: 700; }
    .pos { color: #2e7d32; }
    .neg { color: #d32f2f; }
    .divider { height: 1px; background: #e0e0e0; margin: 8px 0; }
    .highlight { padding-top: 8px; }
    .highlight .label { font-size: 1.1rem; font-weight: 700; color: #333; }
    .highlight .value { font-size: 1.3rem; }
    .desglose { background: #f0f4f8; border-radius: 8px; padding: 10px 12px; }
    .desglose-title { display: block; font-size: 0.8rem; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .metodo-row { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; }
    .metodo-nombre { display: flex; align-items: center; gap: 6px; font-size: 0.95rem; color: #444; }
    .metodo-icon { font-size: 16px; width: 16px; height: 16px; color: #888; }
    .metodo-valor { font-weight: 700; font-size: 0.95rem; }
    .metodo-valor.efectivo { color: #2e7d32; }
    .value.info { color: #1565c0; }
    .hint { font-size: 0.8rem; color: #888; margin: 4px 0 0; text-align: center; }
    .btn-detalle { width: 100%; margin-bottom: 16px; color: #2e7d32; border-color: #a5d6a7; font-size: 0.85rem; }
    .btn-detalle mat-icon { font-size: 18px; width: 18px; height: 18px; margin-right: 4px; vertical-align: middle; }
    .dialog-actions { display: flex; justify-content: center; gap: 16px; }
    .btn-cancel { color: #666; }
    .btn-confirm { padding: 0 24px; border-radius: 8px; }
    
    /* Clases de colores según lógica */
    .status-green { color: #2e7d32; background-color: #e8f5e9; }
    .status-orange { color: #ef6c00; background-color: #fff3e0; }
    .status-red { color: #c62828; background-color: #ffebee; }
    
    .highlight.status-green .value { color: #2e7d32; }
    .highlight.status-orange .value { color: #ef6c00; }
    .highlight.status-red .value { color: #c62828; }
  `]
})
export class ResumenCierreDialog {
  dialogRef = inject(MatDialogRef<ResumenCierreDialog>);
  data: ResumenCierre = inject(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);

  verVentasEnEfectivo() {
    this.dialog.open(VentasEfectivoDialog, {
      width: '480px',
      disableClose: true,
      data: this.data.sesionId
    });
  }

  metodosPago(): { nombre: string; monto: number; esEfectivo: boolean }[] {
    const mapa = this.data.ventasPorMetodoPago || {};
    return Object.entries(mapa).map(([nombre, monto]) => ({
      nombre,
      monto,
      esEfectivo: nombre.toLowerCase().includes('efectivo')
    }));
  }

  getResultClass(): string {
    if (this.data.totalVentas === 0 || this.data.totalVentas < this.data.totalGastos) {
      return 'status-red';
    } else if (this.data.totalVentas === this.data.totalGastos) {
      return 'status-orange';
    } else {
      return 'status-green';
    }
  }

  getIcon(): string {
    if (this.data.totalVentas === 0 || this.data.totalVentas < this.data.totalGastos) return 'warning';
    if (this.data.totalVentas === this.data.totalGastos) return 'info';
    return 'check_circle';
  }
}

@Component({
  selector: 'app-sesiones-trabajo',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule],
  template: `
    <mat-card class="header-card">
      <div class="header-content">
        <div class="title-group">
          <h1>Control de Caja / Sesiones</h1>
          <p>Consulta el estado de la caja y el historial de tus turnos. La apertura y el cierre se gestionan desde Ventas.</p>
        </div>
      </div>
    </mat-card>

    <div class="sesion-container">
      <mat-card class="status-card luxury-card">
        <mat-card-header>
          <mat-card-title>Estado Actual</mat-card-title>
        </mat-card-header>
        <mat-card-content class="status-content">
          <div *ngIf="loading()" class="loading">Cargando información...</div>
          
          <div *ngIf="!loading()">
            <div *ngIf="sesionActiva(); else sinSesion">
              <div class="status-indicator active">
                <mat-icon>check_circle</mat-icon>
                <span>Caja Abierta</span>
              </div>
              <p><strong>Vendedor:</strong> <span class="vendedor-name">{{ sesionActiva()?.nombreUsuario }}</span></p>
              <p><strong>Apertura:</strong> {{ sesionActiva()?.horaInicio | date:'medium' }}</p>
              <p><strong>Estado:</strong> {{ sesionActiva()?.estado }}</p>
            </div>

            <ng-template #sinSesion>
              <div class="status-indicator inactive">
                <mat-icon>lock</mat-icon>
                <span>Caja Cerrada</span>
              </div>
              <p>No tienes un turno activo. Para vender, debes abrir tu caja desde la pantalla de Ventas.</p>
            </ng-template>

            <button mat-raised-button color="primary" class="action-btn" (click)="irAVentas()">
              <mat-icon>point_of_sale</mat-icon>
              Ir a Ventas
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="history-card luxury-card" *ngIf="esAdmin()">
        <mat-card-header>
          <mat-card-title>Mi Historial de Turnos</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <table mat-table [dataSource]="historial()" class="full-width">
            
            <ng-container matColumnDef="estado">
              <th mat-header-cell *matHeaderCellDef> Estado </th>
              <td mat-cell *matCellDef="let s"> 
                <span class="badge" [class.badge-active]="s.estado === 'ABIERTA'">{{ s.estado }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="inicio">
              <th mat-header-cell *matHeaderCellDef> Inicio </th>
              <td mat-cell *matCellDef="let s"> {{ s.horaInicio | date:'short' }} </td>
            </ng-container>

            <ng-container matColumnDef="fin">
              <th mat-header-cell *matHeaderCellDef> Fin </th>
              <td mat-cell *matCellDef="let s"> {{ s.horaFin ? (s.horaFin | date:'short') : '-' }} </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="['estado', 'inicio', 'fin']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['estado', 'inicio', 'fin'];"></tr>
          </table>
          <p *ngIf="historial().length === 0 && !loading()" class="empty-state">No tienes historial de sesiones.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .header-card { margin-bottom: 24px; padding: 24px; border-radius: 12px; border-left: 6px solid var(--primary-pink); }
    .header-content h1 { margin: 0 0 8px 0; font-weight: 800; color: var(--dark-text); font-size: 2rem; }
    .header-content p { margin: 0; color: #666; font-size: 1.1rem; }
    .sesion-container { display: grid; grid-template-columns: 1fr 2fr; gap: 24px; }
    .luxury-card { border-radius: 20px; box-shadow: var(--luxury-shadow); border: 1px solid var(--border-color); padding: 16px; }
    .status-content { padding: 24px; text-align: center; }
    .status-indicator { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 20px; font-size: 1.5rem; font-weight: 700; }
    .status-indicator mat-icon { font-size: 4rem; width: 4rem; height: 4rem; }
    .active { color: #4caf50; }
    .inactive { color: #f44336; }
    .vendedor-name { color: var(--primary-pink); font-weight: 800; font-size: 1.1rem; }
    .action-btn { width: 100%; margin-top: 20px; padding: 24px 0; border-radius: 12px; font-size: 1.1rem; font-weight: bold; }
    .popup-btn { background: linear-gradient(135deg, var(--primary-pink), #e91e63); border: none; transition: transform 0.2s; }
    .popup-btn:hover { transform: scale(1.02); }
    .full-width { width: 100%; }
    .badge { padding: 4px 8px; border-radius: 8px; background: #e0e0e0; font-weight: 600; font-size: 0.8rem; }
    .badge-active { background: #e8f5e9; color: #2e7d32; }
    .empty-state { text-align: center; padding: 20px; color: #757575; }
    .loading { padding: 40px; color: #999; }
    ::ng-deep th.mat-mdc-header-cell { background: #fafafa !important; font-weight: 700 !important; }
    @media (max-width: 768px) { 
      .sesion-container { grid-template-columns: 1fr; } 
    }
  `]
})
export class SesionesTrabajo implements OnInit {
  private sesionService = inject(SesionTrabajoService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  sesionActiva = signal<SesionTrabajo | null>(null);
  historial = signal<SesionTrabajo[]>([]);
  loading = signal<boolean>(true);

  private get userId(): number {
    return this.authService.getCurrentUser()?.id || 0;
  }

  esAdmin(): boolean {
    return this.authService.isAdmin();
  }

  irAVentas() {
    this.router.navigate(['/ventas']);
  }

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    const id = this.userId;
    if (!id) {
      this.toast.error('No se pudo identificar el usuario. Inicia sesión nuevamente.', 'Sesión no autenticada');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    
    this.sesionService.obtenerSesionActiva(id).pipe(
      finalize(() => this.cargarHistorial())
    ).subscribe({
      next: (sesion) => {
        this.sesionActiva.set(sesion);
      },
      error: (err) => {
        console.error('Error obtenerSesionActiva:', err);
        this.sesionActiva.set(null);
      }
    });
  }

  cargarHistorial() {
    this.sesionService.obtenerHistorial(this.userId).subscribe({
      next: (historico) => {
        const sorted = historico.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.historial.set(sorted);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error obtenerHistorial:', err);
        this.toast.error('No se pudo cargar el historial de sesiones.', 'Error');
        this.loading.set(false);
      }
    });
  }
}
