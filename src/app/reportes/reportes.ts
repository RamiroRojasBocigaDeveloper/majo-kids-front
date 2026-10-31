import { Component, inject, OnInit, signal, computed, ElementRef, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, NativeDateAdapter, DateAdapter } from '@angular/material/core';
import { ReporteService, DashboardResponse } from './reporte';
import { ToastService } from '../shared/toast.service';

/** Custom DateAdapter to force DD/MM/YYYY format */
export class CustomDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return date.toDateString();
  }
}

export const MY_FORMATS = {
  parse: {
    dateInput: { month: 'short', year: 'numeric', day: 'numeric' },
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

interface MetodoPagoCard {
  nombre: string;
  monto: number;
  pct: number;
  icon: string;
  color: string;
  bg: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter },
    { provide: MAT_DATE_LOCALE, useValue: 'es-ES' },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="reportes-page">
      <mat-card class="header-card">
        <div class="header-content">
          <div class="title-group">
            <h1>Reportes</h1>
            <p>Análisis financiero de ventas, ganancias y egresos</p>
          </div>
          <div class="date-filter-group">
            <mat-form-field appearance="outline" class="date-picker-single">
              <mat-label>Fecha Inicio</mat-label>
              <input matInput [matDatepicker]="startPicker" [formControl]="range.controls.start" [max]="range.controls.end.value || today" (dateChange)="cargarReporte()">
              <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker panelClass="white-datepicker"></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline" class="date-picker-single">
              <mat-label>Fecha Fin</mat-label>
              <input matInput [matDatepicker]="endPicker" [formControl]="range.controls.end" [min]="range.controls.start.value!" [max]="today" (dateChange)="cargarReporte()">
              <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker panelClass="white-datepicker"></mat-datepicker>
            </mat-form-field>

            <div class="quick-filters">
              <button mat-stroked-button (click)="setRange('week')">Semana</button>
              <button mat-stroked-button (click)="setRange('month')">Mes</button>
              <button mat-flat-button class="btn-filter" (click)="cargarReporte()">
                <mat-icon>refresh</mat-icon> Actualizar
              </button>
            </div>
          </div>
        </div>
      </mat-card>

      <div *ngIf="loading" class="progress-container">
        <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      </div>

      <ng-container *ngIf="data() as d">

        <!-- ==================== KPIs PRINCIPALES ==================== -->
        <div class="kpi-row">
          <div class="kpi-card accent-pink">
            <div class="kpi-icon"><mat-icon>trending_up</mat-icon></div>
            <div class="kpi-info">
              <span class="kpi-label">Ventas totales</span>
              <span class="kpi-value">{{ d.totalVentas | currency:'COP':'symbol':'1.0-0' }}</span>
            </div>
          </div>
          <div class="kpi-card accent-red">
            <div class="kpi-icon"><mat-icon>receipt_long</mat-icon></div>
            <div class="kpi-info">
              <span class="kpi-label">Total egresos</span>
              <span class="kpi-value">{{ (d.totalGastos || 0) + (d.totalSueldos || 0) | currency:'COP':'symbol':'1.0-0' }}</span>
            </div>
          </div>
          <div class="kpi-card accent-green">
            <div class="kpi-icon"><mat-icon>savings</mat-icon></div>
            <div class="kpi-info">
              <span class="kpi-label">Ganancia total</span>
              <span class="kpi-value">{{ d.gananciaProductos | currency:'COP':'symbol':'1.0-0' }}</span>
            </div>
          </div>
          <div class="kpi-card accent-violet" [class.is-negative]="d.gananciaNeta < 0">
            <div class="kpi-icon"><mat-icon>account_balance_wallet</mat-icon></div>
            <div class="kpi-info">
              <span class="kpi-label">Flujo de caja neto</span>
              <span class="kpi-value">{{ d.gananciaNeta | currency:'COP':'symbol':'1.0-0' }}</span>
            </div>
          </div>
        </div>

        <!-- ============ INGRESOS POR MEDIO DE PAGO ============ -->
        <section class="panel">
          <div class="section-head">
            <div class="section-icon"><mat-icon>account_balance_wallet</mat-icon></div>
            <div class="section-titles">
              <span class="eyebrow">Distribución de ingresos</span>
              <h2>Dinero recibido por medio de pago</h2>
            </div>
          </div>

          <div class="pay-grid" *ngIf="metodosPago().length > 0; else sinMetodos">
            <div class="pay-card" *ngFor="let m of metodosPago()">
              <div class="pay-icon" [style.color]="m.color" [style.background]="m.bg">
                <mat-icon>{{ m.icon }}</mat-icon>
              </div>
              <span class="pay-label">{{ m.nombre }}</span>
              <span class="pay-value">{{ m.monto | currency:'COP':'symbol':'1.0-0' }}</span>
              <div class="pay-bar">
                <div class="pay-bar-fill" [style.width.%]="m.pct" [style.background]="m.color"></div>
              </div>
              <span class="pay-sub">{{ m.pct }}% del total</span>
            </div>
          </div>
          <ng-template #sinMetodos>
            <p class="empty-inline">No hay ventas registradas en este período.</p>
          </ng-template>
        </section>

        <!-- ==================== DISTRIBUCIÓN (GRÁFICAS) ==================== -->
        <div class="charts-row">
          <section class="panel chart-panel">
            <div class="section-head compact">
              <div class="section-icon small pink"><mat-icon>pie_chart</mat-icon></div>
              <div class="section-titles">
                <span class="eyebrow">Categorías</span>
                <h3>Ventas</h3>
              </div>
            </div>
            <div class="chart-body"><canvas #catChart></canvas></div>
          </section>
          <section class="panel chart-panel">
            <div class="section-head compact">
              <div class="section-icon small green"><mat-icon>donut_small</mat-icon></div>
              <div class="section-titles">
                <span class="eyebrow">Categorías</span>
                <h3>Ganancias</h3>
              </div>
            </div>
            <div class="chart-body"><canvas #profitChart></canvas></div>
          </section>
          <section class="panel chart-panel">
            <div class="section-head compact">
              <div class="section-icon small red"><mat-icon>pie_chart_outline</mat-icon></div>
              <div class="section-titles">
                <span class="eyebrow">Categorías</span>
                <h3>Gastos</h3>
              </div>
            </div>
            <div class="chart-body"><canvas #expChart></canvas></div>
          </section>
        </div>

        <!-- ==================== BALANCE + TOP 10 ==================== -->
        <div class="duo-row">
          <section class="panel chart-panel">
            <div class="section-head compact">
              <div class="section-icon small violet"><mat-icon>bar_chart</mat-icon></div>
              <div class="section-titles">
                <span class="eyebrow">Resumen</span>
                <h3>Ingresos vs Egresos</h3>
              </div>
            </div>
            <div class="chart-body tall"><canvas #compChart></canvas></div>
          </section>

          <section class="panel">
            <div class="section-head compact">
              <div class="section-icon small amber"><mat-icon>emoji_events</mat-icon></div>
              <div class="section-titles">
                <span class="eyebrow">Unidades vendidas</span>
                <h3>Top 10 productos</h3>
              </div>
            </div>
            <div class="top-list" *ngIf="productosTop10().length > 0; else sinProductos">
              <div class="top-row" *ngFor="let item of productosTop10(); let i = index">
                <span class="rank" [class]="'rank-' + (i + 1)">{{ i + 1 }}</span>
                <div class="top-info">
                  <div class="top-name-line">
                    <span class="top-name">{{ item.nombre }}</span>
                    <span class="top-cant">{{ item.cantidad }} u.</span>
                  </div>
                  <div class="top-bar">
                    <div class="top-bar-fill" [style.width.%]="(item.cantidad / (productosTop10()[0].cantidad || 1)) * 100"></div>
                  </div>
                </div>
              </div>
            </div>
            <ng-template #sinProductos>
              <p class="empty-inline">No hay ventas registradas en este período.</p>
            </ng-template>
          </section>
        </div>

        <!-- ==================== RESUMEN POR CATEGORÍA (UNIFICADO) ==================== -->
        <section class="panel" *ngIf="resumenCategorias().length > 0">
          <div class="section-head">
            <div class="section-icon"><mat-icon>category</mat-icon></div>
            <div class="section-titles">
              <span class="eyebrow">Ventas · Ganancia · Margen</span>
              <h2>Resumen por categoría</h2>
            </div>
          </div>
          <div class="table-wrap summary-wrap">
            <table class="data-table summary-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th class="text-right">Ventas</th>
                  <th class="text-right">Ganancia</th>
                  <th class="text-center">Margen</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of resumenCategorias()">
                  <td class="cell-cat">
                    <span class="cat-dot" [style.background]="getCatColor(r.categoria)"></span>
                    <span class="cat-nombre">{{ r.categoria }}</span>
                  </td>
                  <td class="text-right cell-num">
                    <span class="num-strong">{{ r.ventas | currency:'COP':'symbol':'1.0-0' }}</span>
                    <div class="micro-bar"><div class="micro-fill pink" [style.width.%]="r.ventasPct"></div></div>
                  </td>
                  <td class="text-right cell-num">
                    <span class="num-strong green" [class.negative]="r.ganancia < 0">{{ r.ganancia | currency:'COP':'symbol':'1.0-0' }}</span>
                    <div class="micro-bar"><div class="micro-fill green-fill" [style.width.%]="r.gananciaPct"></div></div>
                  </td>
                  <td class="text-center">
                    <span class="margin-chip" [class.margin-pos]="r.margen >= 20" [class.margin-neg]="r.margen < 0" [class.margin-mid]="r.margen >= 0 && r.margen < 20">
                      {{ r.margen >= 0 ? '+' : '' }}{{ r.margen | number:'1.0-1' }}%
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td class="cell-cat">Total</td>
                  <td class="text-right"><span class="num-strong">{{ totalesResumen().ventas | currency:'COP':'symbol':'1.0-0' }}</span></td>
                  <td class="text-right"><span class="num-strong green">{{ totalesResumen().ganancia | currency:'COP':'symbol':'1.0-0' }}</span></td>
                  <td class="text-center">
                    <span class="margin-chip" [class.margin-pos]="totalesResumen().margen >= 20" [class.margin-neg]="totalesResumen().margen < 0" [class.margin-mid]="totalesResumen().margen >= 0 && totalesResumen().margen < 20">
                      {{ totalesResumen().margen >= 0 ? '+' : '' }}{{ totalesResumen().margen | number:'1.0-1' }}%
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <!-- ==================== DESGLOSE DE EGRESOS ==================== -->
        <section class="panel" *ngIf="gastosJerarquicos().length > 0">
          <div class="section-head">
            <div class="section-icon red"><mat-icon>rule</mat-icon></div>
            <div class="section-titles">
              <span class="eyebrow">Categoría → detalle</span>
              <h2>Desglose de egresos</h2>
            </div>
          </div>
          <div class="expense-list">
            <div class="expense-group" *ngFor="let group of gastosJerarquicos()">
              <div class="expense-group-header">
                <span class="expense-cat-name">{{ group.categoria }}</span>
                <span class="expense-cat-total">{{ group.total | currency:'COP':'symbol':'1.0-0' }}</span>
              </div>
              <div class="expense-sub-row" *ngFor="let sub of group.subItems">
                <span class="expense-sub-name">{{ sub.nombre }}</span>
                <span class="expense-sub-monto">{{ sub.monto | currency:'COP':'symbol':'1.0-0' }}</span>
              </div>
            </div>
            <div class="expense-total-row">
              <span>Total general de egresos</span>
              <strong>{{ (d.totalGastos || 0) + (d.totalSueldos || 0) | currency:'COP':'symbol':'1.0-0' }}</strong>
            </div>
          </div>
        </section>

        <!-- ==================== HISTORIAL DE VENTAS ==================== -->
        <section class="panel">
          <button class="toggle-head" (click)="showVentas.set(!showVentas())"
                  [attr.aria-expanded]="showVentas()" aria-label="Mostrar u ocultar historial de ventas">
            <div class="section-head compact no-pointer">
              <div class="section-icon small pink"><mat-icon>receipt_long</mat-icon></div>
              <div class="section-titles">
                <span class="eyebrow">{{ d.detalleVentas.length }} registros</span>
                <h3>Historial detallado de ventas</h3>
              </div>
            </div>
            <span class="action-chip" [class.open]="showVentas()">
              <span class="chip-text">{{ showVentas() ? 'Ocultar historial' : 'Ver historial' }}</span>
              <mat-icon class="chevron">{{ showVentas() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </span>
          </button>

          <div class="collapse-body" *ngIf="showVentas()">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Ref.</th>
                    <th>Producto / Categoría</th>
                    <th>Método</th>
                    <th>Fecha</th>
                    <th>Vendedor</th>
                    <th class="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let v of d.detalleVentas">
                    <td>
                      <div *ngFor="let det of v.detalles" class="ref-line">{{ det.productoReferencia }}</div>
                    </td>
                    <td>
                      <div *ngFor="let det of v.detalles" class="prod-line">
                        <strong>{{ det.productoNombre }}</strong>
                        <span class="cat-chip">{{ det.categoriaNombre }}</span>
                      </div>
                    </td>
                    <td><span class="method-chip">{{ v.metodoPagoNombre || '-' }}</span></td>
                    <td class="cell-sub">
                      <strong>{{ (v.fechaRegistroManual || v.createdAt) | date:'dd/MM/yyyy' }}</strong>
                      <small>{{ v.createdAt | date:'shortTime' }}</small>
                    </td>
                    <td><span class="user-chip">{{ v.nombreVendedor || 'Vendedor' }}</span></td>
                    <td class="text-right cell-strong">{{ v.total | currency:'COP':'symbol':'1.0-0' }}</td>
                  </tr>
                  <tr *ngIf="!d.detalleVentas.length">
                    <td colspan="6" class="empty-cell">No se encontraron ventas en este periodo.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- ==================== HISTORIAL DE EGRESOS ==================== -->
        <section class="panel" *ngIf="d.detalleGastos">
          <button class="toggle-head" (click)="showGastos.set(!showGastos())"
                  [attr.aria-expanded]="showGastos()" aria-label="Mostrar u ocultar historial de egresos">
            <div class="section-head compact no-pointer">
              <div class="section-icon small red"><mat-icon>remove_shopping_cart</mat-icon></div>
              <div class="section-titles">
                <span class="eyebrow">{{ d.detalleGastos.length }} registros</span>
                <h3>Historial detallado de egresos</h3>
              </div>
            </div>
            <span class="action-chip" [class.open]="showGastos()">
              <span class="chip-text">{{ showGastos() ? 'Ocultar historial' : 'Ver historial' }}</span>
              <mat-icon class="chevron">{{ showGastos() ? 'expand_less' : 'expand_more' }}</mat-icon>
            </span>
          </button>

          <div class="collapse-body" *ngIf="showGastos()">
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Categoría</th>
                    <th>Descripción</th>
                    <th>Responsable</th>
                    <th class="text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let g of d.detalleGastos">
                    <td class="cell-sub">
                      <strong>{{ (g.fechaRegistroManual || g.createdAt) | date:'dd/MM/yyyy' }}</strong>
                      <small>{{ g.createdAt | date:'shortTime' }}</small>
                    </td>
                    <td><span class="cat-chip red">{{ g.categoriaGastoNombre }}</span></td>
                    <td class="cell-desc">{{ g.descripcion }}</td>
                    <td><span class="user-chip">{{ g.nombreUsuario || 'Admin' }}</span></td>
                    <td class="text-right cell-strong red">{{ g.monto | currency:'COP':'symbol':'1.0-0' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </ng-container>
    </div>
  `,
  styles: []
})
export class Reportes implements OnInit, OnDestroy {
  private reporteService = inject(ReporteService);
  private zone = inject(NgZone);
  private router = inject(Router);
  private toast = inject(ToastService);
  private routerSub?: Subscription;

  @ViewChild('catChart') catChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('profitChart') profitChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('expChart') expChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('compChart') compChartRef!: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];

  private copFmt = new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0
  });

  data = signal<DashboardResponse | null>(null);
  loading = false;
  today = new Date();

  showVentas = signal(false);
  showGastos = signal(false);

  range = new FormGroup({
    start: new FormControl<Date | null>(new Date(new Date().setDate(1))),
    end: new FormControl<Date | null>(new Date())
  });

  metodosPago = computed<MetodoPagoCard[]>(() => {
    const mapa = this.data()?.ventasPorMetodoPago || {};
    const total = this.data()?.totalVentas || 0;
    return Object.entries(mapa).map(([nombre, monto]) => {
      const info = this.metodoInfo(nombre);
      return {
        nombre,
        monto,
        pct: total > 0 ? Math.round((monto / total) * 1000) / 10 : 0,
        ...info
      };
    }).sort((a, b) => b.monto - a.monto);
  });

  productosTop10 = computed(() => this.productosMasVendidos().slice(0, 10));

  private metodoInfo(nombre: string): { icon: string; color: string; bg: string } {
    const n = nombre.toLowerCase();
    if (n.includes('efectivo')) return { icon: 'payments', color: '#2e7d32', bg: '#e8f5e9' };
    if (n.includes('nequi')) return { icon: 'smartphone', color: '#6a1b9a', bg: '#f3e5f5' };
    if (n.includes('daviplata')) return { icon: 'smartphone', color: '#c62828', bg: '#ffebee' };
    if (n.includes('transfer') || n.includes('consign')) return { icon: 'account_balance', color: '#1565c0', bg: '#e3f2fd' };
    if (n.includes('tarjeta') || n.includes('credito') || n.includes('debito')) {
      return { icon: 'credit_card', color: '#ef6c00', bg: '#fff3e0' };
    }
    return { icon: 'swap_horiz', color: '#d81b60', bg: '#fce4ec' };
  }

  // Paleta cualitativa tipo Tableau: tonos bien separados en hue y luminosidad,
  // diseñada para distinguirse incluso en monitores de baja calidad.
  private readonly DONUT_PALETTE = [
    '#4e79a7', // azul
    '#f28e2b', // naranja
    '#59a14f', // verde
    '#e15759', // rojo
    '#76b7b2', // teal
    '#edc948', // amarillo
    '#b07aa1', // violeta
    '#ff9da7', // rosa
    '#9c755f', // marrón
    '#7f7f7f'  // gris
  ];

  private sortedEntries(map: { [key: string]: number }): [string, number][] {
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  private colorForIndex(i: number): string {
    return this.DONUT_PALETTE[i % this.DONUT_PALETTE.length];
  }

  ngOnInit() {
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.today = new Date();
      this.range.patchValue({ end: new Date() });
      this.cargarReporte();
    });
    this.cargarReporte();
  }

  ngOnDestroy() {
    this.destroyCharts();
    this.routerSub?.unsubscribe();
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  cargarReporte() {
    const { start, end } = this.range.value;
    if (!start || !end) return;

    this.loading = true;
    const inicio = this.formatDate(start);
    const fin = this.formatDate(end);

    this.reporteService.obtenerPorRango(inicio, fin).subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading = false;
        setTimeout(() => this.initCharts(), 100);
      },
      error: (err) => {
        this.loading = false;
        const status = err.status;
        let msg = 'Error al cargar el reporte';
        if (status === 403) msg = 'No tienes permisos para ver los reportes (se requiere rol Administrador)';
        else if (status === 500) msg = 'Error interno del servidor al generar el reporte. Revisa la consola del backend.';
        else if (status === 0) msg = 'No se pudo conectar con el servidor. ¿Está el backend encendido?';
        console.error('Error en reporte:', err);
        this.toast.error(msg, 'No se pudo cargar el reporte');
      }
    });
  }

  setRange(type: 'week' | 'month') {
    const end = new Date();
    let start = new Date();
    if (type === 'week') {
      const day = start.getDay();
      start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
    } else {
      start = new Date(start.getFullYear(), start.getMonth(), 1);
    }
    this.range.patchValue({ start, end });
    this.cargarReporte();
  }

  productosMasVendidos() {
    const list = this.data()?.productosMasVendidos || {};
    return Object.entries(list).map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  gastosJerarquicos = computed(() => {
    const map = this.data()?.gastosDesglosados || {};
    return Object.entries(map).map(([categoria, subMap]) => {
      const subItems = Object.entries(subMap).map(([nombre, monto]) => ({ nombre, monto }))
        .sort((a, b) => b.monto - a.monto);
      const total = subItems.reduce((sum, s) => sum + s.monto, 0);
      return { categoria, total, subItems };
    }).sort((a, b) => b.total - a.total);
  });

  resumenCategorias = computed(() => {
    const d = this.data();
    if (!d) return [];
    const nombres = new Set<string>([
      ...Object.keys(d.ventasPorCategoria),
      ...Object.keys(d.gananciasPorCategoria)
    ]);
    const filas = Array.from(nombres).map(categoria => {
      const ventas = d.ventasPorCategoria[categoria] || 0;
      const ganancia = d.gananciasPorCategoria[categoria] || 0;
      const margen = ventas > 0 ? (ganancia / ventas) * 100 : 0;
      return { categoria, ventas, ganancia, margen };
    }).sort((a, b) => b.ventas - a.ventas);

    const maxVentas = Math.max(...filas.map(f => f.ventas), 1);
    const maxGanancia = Math.max(...filas.map(f => Math.abs(f.ganancia)), 1);
    return filas.map(f => ({
      ...f,
      ventasPct: (f.ventas / maxVentas) * 100,
      gananciaPct: (Math.abs(f.ganancia) / maxGanancia) * 100
    }));
  });

  totalesResumen = computed(() => {
    const filas = this.resumenCategorias();
    const ventas = filas.reduce((s, f) => s + f.ventas, 0);
    const ganancia = filas.reduce((s, f) => s + f.ganancia, 0);
    return { ventas, ganancia, margen: ventas > 0 ? (ganancia / ventas) * 100 : 0 };
  });

  getCatColor(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('niña') || n.includes('nina')) return '#ff9da7';
    if (n.includes('mujer')) return '#b07aa1';
    if (n.includes('niño') || n.includes('nino')) return '#4e79a7';
    if (n.includes('hombre')) return '#76b7b2';
    const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return this.DONUT_PALETTE[hash % this.DONUT_PALETTE.length];
  }

  private money(value: number): string {
    return this.copFmt.format(value);
  }

  private initCharts() {
    this.zone.runOutsideAngular(() => {
      this.destroyCharts();
      const d = this.data();
      if (!d) return;

      const legendOpts = {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8,
          padding: 14, font: { family: 'Outfit', size: 11, weight: 500 as const }, color: '#5f6368'
        }
      };

      const doughnutBase = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '66%',
        plugins: {
          legend: legendOpts,
          tooltip: {
            backgroundColor: '#1a1a1a', padding: 12, cornerRadius: 10,
            titleFont: { family: 'Outfit', weight: 700 as const },
            bodyFont: { family: 'Outfit' },
            callbacks: { label: (ctx: any) => ' ' + this.money(Number(ctx.parsed)) }
          }
        }
      };

      // Ventas por categoría
      if (this.catChartRef) {
        const ctx = this.catChartRef.nativeElement.getContext('2d');
        if (ctx) {
          const entries = this.sortedEntries(d.ventasPorCategoria);
          this.charts.push(new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: entries.map(e => e[0]),
              datasets: [{
                data: entries.map(e => e[1]),
                backgroundColor: entries.map((_, i) => this.colorForIndex(i)),
                borderWidth: 3, borderColor: '#fff', hoverOffset: 8
              }]
            },
            options: doughnutBase
          }));
        }
      }

      // Ganancias por categoría
      if (this.profitChartRef) {
        const ctx = this.profitChartRef.nativeElement.getContext('2d');
        if (ctx) {
          const entries = this.sortedEntries(d.gananciasPorCategoria);
          this.charts.push(new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: entries.map(e => e[0]),
              datasets: [{
                data: entries.map(e => e[1]),
                backgroundColor: entries.map((_, i) => this.colorForIndex(i)),
                borderWidth: 3, borderColor: '#fff', hoverOffset: 8
              }]
            },
            options: doughnutBase
          }));
        }
      }

      // Gastos por categoría
      if (this.expChartRef) {
        const ctx = this.expChartRef.nativeElement.getContext('2d');
        if (ctx) {
          const entries = this.sortedEntries(d.gastosPorCategoria);
          this.charts.push(new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: entries.map(e => e[0]),
              datasets: [{
                data: entries.map(e => e[1]),
                backgroundColor: entries.map((_, i) => this.colorForIndex(i)),
                borderWidth: 3, borderColor: '#fff', hoverOffset: 8
              }]
            },
            options: doughnutBase
          }));
        }
      }

      // Balance ingresos vs egresos
      if (this.compChartRef) {
        const ctx = this.compChartRef.nativeElement.getContext('2d');
        if (ctx) {
          this.charts.push(new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['Ingresos', 'Egresos'],
              datasets: [{
                label: 'Pesos',
                data: [d.totalVentas, d.totalGastos + d.totalSueldos],
                backgroundColor: ['#2e7d32', '#c62828'],
                borderRadius: 12, barThickness: 56
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: '#f3f4f6' },
                  border: { display: false },
                  ticks: {
                    font: { family: 'Outfit', size: 11 }, color: '#5f6368',
                    callback: (value: any) => value >= 1000000
                      ? '$' + (Number(value) / 1000000).toFixed(1) + 'M'
                      : '$' + Number(value).toLocaleString('es-CO')
                  }
                },
                x: {
                  grid: { display: false },
                  border: { display: false },
                  ticks: { font: { family: 'Outfit', size: 12, weight: 600 as const }, color: '#1a1a1a' }
                }
              },
              plugins: {
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#1a1a1a', padding: 12, cornerRadius: 10,
                  titleFont: { family: 'Outfit', weight: 700 as const },
                  bodyFont: { family: 'Outfit' },
                  callbacks: { label: (ctx: any) => ' ' + this.money(Number(ctx.parsed.y)) }
                }
              }
            }
          }));
        }
      }
    });
  }
}
