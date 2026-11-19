import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CompraMercancia, CompraMercanciaRequest, CompraMercanciaService } from './compra-mercancia';
import { CompraMercanciaDialog } from './compra-mercancia-dialog/compra-mercancia-dialog';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-compras-mercancia',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule
  ],
  template: `
    <div class="compras-page">
      <mat-card class="header-card">
        <div class="header-content">
          <div class="title-group">
            <span class="eyebrow">Inversión · Surtido</span>
            <h1>Compras de mercancía</h1>
            <p>Registra el surtido del almacén. No afecta la caja del vendedor.</p>
          </div>
          <div class="header-actions">
            <button mat-stroked-button class="btn-refresh" (click)="cargar()" [disabled]="loading">
              <mat-icon>refresh</mat-icon> Actualizar
            </button>
            <button mat-flat-button class="btn-new" (click)="nuevaCompra()">
              <mat-icon>add_shopping_cart</mat-icon> Nueva compra
            </button>
          </div>
        </div>
      </mat-card>

      <div class="progress-container" *ngIf="loading">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon pink"><mat-icon>shopping_basket</mat-icon></div>
          <div>
            <span class="kpi-label">Total comprado</span>
            <span class="kpi-value">{{ totalCompras() | currency:'COP':'symbol':'1.0-0' }}</span>
            <span class="kpi-sub">{{ compras.length }} compra(s)</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green"><mat-icon>payments</mat-icon></div>
          <div>
            <span class="kpi-label">Pagado en efectivo</span>
            <span class="kpi-value">{{ totalEfectivo() | currency:'COP':'symbol':'1.0-0' }}</span>
            <span class="kpi-sub">Sale del dinero del negocio</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon blue"><mat-icon>account_balance</mat-icon></div>
          <div>
            <span class="kpi-label">Pagado por transferencia</span>
            <span class="kpi-value">{{ totalTransferencia() | currency:'COP':'symbol':'1.0-0' }}</span>
            <span class="kpi-sub">No toca el efectivo físico</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon amber"><mat-icon>inventory_2</mat-icon></div>
          <div>
            <span class="kpi-label">Unidades ingresadas</span>
            <span class="kpi-value">{{ totalUnidades() }}</span>
            <span class="kpi-sub">Stock actualizado automáticamente</span>
          </div>
        </div>
      </div>

      <mat-card class="panel">
        <div class="panel-head">
          <div class="section-icon"><mat-icon>receipt_long</mat-icon></div>
          <div>
            <span class="eyebrow">Historial</span>
            <h2>Compras registradas</h2>
          </div>
        </div>

        <div class="table-wrap" *ngIf="compras.length > 0; else sinCompras">
          <table class="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto / Detalle</th>
                <th>Proveedor</th>
                <th>Pago</th>
                <th class="text-center">Productos</th>
                <th class="text-right">Total</th>
                <th>Registró</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let c of compras">
                <tr class="main-row" (click)="toggle(c.id)">
                  <td class="cell-date">{{ c.fecha | date:'dd/MM/yyyy':'UTC' }}</td>
                  <td>
                    <strong *ngIf="c.lineas.length > 0">{{ c.lineas[0].productoNombre }} ({{ c.lineas[0].referencia }})<span *ngIf="c.lineas.length > 1"> (+{{ c.lineas.length - 1 }})</span></strong>
                    <strong *ngIf="!c.lineas || c.lineas.length === 0">{{ c.descripcion || c.proveedor || 'Compra de mercancía' }}</strong>
                    <span class="cell-sub" *ngIf="c.descripcion && c.lineas.length > 0">{{ c.descripcion }}</span>
                  </td>
                  <td>{{ c.proveedor || "—" }}
                  </td>
                  <td>
                    <span class="method-chip" [class.cash]="c.metodoPago === 'EFECTIVO'" [class.transfer]="c.metodoPago === 'TRANSFERENCIA'">
                      {{ metodoLabel(c.metodoPago) }}
                    </span>
                  </td>
                  <td class="text-center">
                    <span class="count-chip">{{ unidades(c) }}</span>
                  </td>
                  <td class="text-right cell-money">{{ c.montoTotal | currency:'COP':'symbol':'1.0-0' }}</td>
                  <td class="cell-user">{{ c.usuarioNombre || '—' }}</td>
                  <td class="text-right">
                    <mat-icon class="expand-icon">{{ expandidas.has(c.id) ? 'expand_less' : 'expand_more' }}</mat-icon>
                  </td>
                </tr>
                <tr class="detail-row" *ngIf="expandidas.has(c.id)">
                  <td colspan="7">
                    <div class="detail-body" *ngIf="c.lineas.length > 0; else sinDetalle">
                      <div class="detail-line" *ngFor="let l of c.lineas">
                        <span class="detail-name">{{ l.productoNombre }} <small>({{ l.referencia }})</small></span>
                        <span class="detail-qty">{{ l.cantidad }} u. × {{ l.costoUnitario | currency:'COP':'symbol':'1.0-0' }}</span>
                        <strong class="detail-sub">{{ l.subtotal | currency:'COP':'symbol':'1.0-0' }}</strong>
                      </div>
                    </div>
                    <ng-template #sinDetalle>
                      <p class="migrada">
                        Compra migrada sin detalle de productos. Suma en los indicadores financieros,
                        pero no generó movimiento de inventario.
                      </p>
                    </ng-template>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <ng-template #sinCompras>
          <div class="empty-state">
            <mat-icon>shopping_basket</mat-icon>
            <h3>No hay compras registradas</h3>
            <p>Registra la primera compra de surtido para actualizar el stock y el capital disponible.</p>
          </div>
        </ng-template>
      </mat-card>
    </div>
  `,
  styles: [`
    .compras-page { display: block; }
    .header-card { border-radius: 18px; padding: 22px 24px; margin-bottom: 18px; }
    .header-content { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
    .title-group h1 { margin: 2px 0 4px; font-size: 1.6rem; font-weight: 800; color: var(--dark-text); letter-spacing: -0.5px; }
    .title-group p { margin: 0; color: #7a716c; font-size: 0.92rem; }
    .eyebrow { text-transform: uppercase; letter-spacing: 1.2px; font-size: 0.68rem; font-weight: 800; color: #a08f86; }
    .header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-new { background: var(--primary-pink); color: #fff; border-radius: 12px; font-weight: 800; padding: 8px 18px; }
    .btn-refresh { border-radius: 12px; font-weight: 700; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 18px; }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 520px) { .kpi-grid { grid-template-columns: 1fr; } }
    .kpi-card { background: #fff; border-radius: 16px; padding: 16px; display: flex; align-items: center; gap: 12px;
                box-shadow: 0 6px 22px rgba(0,0,0,0.05); border: 1px solid #f0ebe8; }
    .kpi-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon.pink { background: #fdecef; color: #c25463; }
    .kpi-icon.green { background: #e8f5e9; color: #2e7d32; }
    .kpi-icon.blue { background: #e3f2fd; color: #1565c0; }
    .kpi-icon.amber { background: #fff4e0; color: #b26a00; }
    .kpi-label { display: block; font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.7px; color: #8a817c; font-weight: 700; }
    .kpi-value { display: block; font-size: 1.25rem; font-weight: 800; color: var(--dark-text); margin-top: 2px; }
    .kpi-sub { display: block; font-size: 0.75rem; color: #9a918c; margin-top: 2px; }
    .panel { border-radius: 18px; padding: 22px 24px; }
    .panel-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .panel-head h2 { margin: 2px 0 0; font-size: 1.2rem; color: var(--dark-text); }
    .section-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center;
                    background: #fdecef; color: #c25463; }
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; min-width: 760px; }
    .data-table th { text-align: left; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.8px;
                     color: #9a918c; font-weight: 800; padding: 10px 12px; border-bottom: 2px solid #f1ebe7; }
    .data-table td { padding: 12px; border-bottom: 1px solid #f5f0ed; font-size: 0.9rem; color: #3a3a3a; vertical-align: middle; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .main-row { cursor: pointer; transition: background 0.15s ease; }
    .main-row:hover { background: #fcf8f6; }
    .cell-date { white-space: nowrap; font-weight: 600; color: #5f5752; }
    .cell-sub { display: block; font-size: 0.76rem; color: #9a918c; margin-top: 2px; }
    .cell-money { font-weight: 800; color: #2e7d32; white-space: nowrap; }
    .cell-user { color: #7a716c; font-size: 0.84rem; }
    .method-chip { display: inline-flex; padding: 4px 10px; border-radius: 999px; font-size: 0.72rem; font-weight: 800; }
    .method-chip.cash { background: #e8f5e9; color: #2e7d32; }
    .method-chip.transfer { background: #e3f2fd; color: #1565c0; }
    .count-chip { display: inline-flex; min-width: 26px; justify-content: center; padding: 3px 8px;
                  border-radius: 999px; background: #f6f1ee; color: #6d625c; font-weight: 800; font-size: 0.78rem; }
    .expand-icon { color: #a59a94; }
    .detail-row td { background: #fbf9f8; border-bottom: 1px solid #f0e9e5; padding: 8px 16px 14px; }
    .detail-body { display: flex; flex-direction: column; gap: 6px; }
    .detail-line { display: flex; align-items: center; gap: 14px; padding: 7px 10px; border-radius: 8px; background: #fff; }
    .detail-name { flex: 1; font-weight: 600; color: #3f3a37; }
    .detail-name small { color: #9a918c; font-weight: 500; }
    .detail-qty { color: #7a716c; font-size: 0.84rem; white-space: nowrap; }
    .detail-sub { color: #2e7d32; white-space: nowrap; }
    .migrada { margin: 0; color: #9a6a2e; font-size: 0.84rem; }
    .empty-state { text-align: center; padding: 40px 16px; color: #8a817c; }
    .empty-state mat-icon { font-size: 52px; width: 52px; height: 52px; color: #d8ccc6; }
    .empty-state h3 { margin: 10px 0 4px; color: #5f5752; }
    .empty-state p { margin: 0; font-size: 0.9rem; }
    .progress-container { margin-bottom: 12px; }
  `]
})
export class ComprasMercancia implements OnInit {
  private compraService = inject(CompraMercanciaService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  compras: CompraMercancia[] = [];
  loading = false;
  expandidas = new Set<number>();

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.compraService.listar().subscribe({
      next: (res) => {
        this.compras = res;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(this.mensajeError(err), 'No se pudieron cargar las compras');
      }
    });
  }

  nuevaCompra() {
    const ref = this.dialog.open(CompraMercanciaDialog, {
      width: '880px',
      maxWidth: '96vw',
      disableClose: true
    });

    ref.afterClosed().subscribe((request: CompraMercanciaRequest | undefined) => {
      if (!request) {
        return;
      }
      this.compraService.crear(request).subscribe({
        next: (compra) => {
          this.toast.success(
            `Compra registrada por ${this.formato(compra.montoTotal)}. Stock y capital actualizados.`,
            'Compra guardada'
          );
          this.cargar();
        },
        error: (err) => this.toast.error(this.mensajeError(err), 'No se pudo registrar la compra')
      });
    });
  }

  toggle(id: number) {
    if (this.expandidas.has(id)) {
      this.expandidas.delete(id);
    } else {
      this.expandidas.add(id);
    }
  }

  totalCompras(): number {
    return this.compras.reduce((sum, c) => sum + Number(c.montoTotal || 0), 0);
  }

  totalEfectivo(): number {
    return this.compras
      .filter(c => c.metodoPago === 'EFECTIVO')
      .reduce((sum, c) => sum + Number(c.montoTotal || 0), 0);
  }

  totalTransferencia(): number {
    return this.compras
      .filter(c => c.metodoPago === 'TRANSFERENCIA')
      .reduce((sum, c) => sum + Number(c.montoTotal || 0), 0);
  }

  totalUnidades(): number {
    return this.compras.reduce((sum, c) => sum + this.unidades(c), 0);
  }

  unidades(compra: CompraMercancia): number {
    return (compra.lineas || []).reduce((sum, l) => sum + Number(l.cantidad || 0), 0);
  }

  metodoLabel(metodo: string): string {
    if (metodo === 'EFECTIVO') return 'Efectivo';
    if (metodo === 'TRANSFERENCIA') return 'Transferencia';
    return 'Sin dato';
  }

  private formato(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor || 0);
  }

  private mensajeError(err: any): string {
    if (typeof err?.error === 'string' && err.error.trim().length > 0) {
      return err.error;
    }
    if (err?.status === 403) {
      return 'Solo un administrador puede registrar compras de mercancía.';
    }
    if (err?.status === 0) {
      return 'No se pudo conectar con el servidor. ¿Está el backend encendido?';
    }
    return 'Ocurrió un error inesperado. Intenta de nuevo.';
  }
}
