import { Component, inject, OnInit, signal, computed, ElementRef, ViewChild, NgZone, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
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
    MatDividerModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
  ],
  template: `
    <mat-card class="header-card">
      <div class="header-content">
        <div class="title-group">
          <h1>Análisis Financiero Premium</h1>
          <p>Visualización avanzada de rentabilidad y rendimiento</p>
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
              <mat-icon>analytics</mat-icon> Actualizar
            </button>
          </div>
        </div>
      </div>
    </mat-card>

    <div *ngIf="loading" class="progress-container">
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    </div>

    <div class="kpi-container" *ngIf="data()">
      <div class="kpi-card-luxury sales-card">
        <div class="kpi-icon">📈</div>
        <div class="kpi-info">
          <span class="kpi-label">VENTAS TOTALES</span>
          <h2 class="kpi-value">{{data()?.totalVentas | currency:'COP':'symbol':'1.0-0'}}</h2>
        </div>
      </div>

      <div class="kpi-card-luxury expenses-card">
        <div class="kpi-icon">💸</div>
        <div class="kpi-info">
          <span class="kpi-label">TOTAL GASTOS</span>
          <h2 class="kpi-value">{{(data()?.totalGastos || 0) + (data()?.totalSueldos || 0) | currency:'COP':'symbol':'1.0-0'}}</h2>
        </div>
      </div>

      <div class="kpi-card-luxury profit-card">
        <div class="kpi-icon">💰</div>
        <div class="kpi-info">
          <span class="kpi-label">GANANCIA TOTAL</span>
          <h2 class="kpi-value">{{data()?.gananciaProductos | currency:'COP':'symbol':'1.0-0'}}</h2>
        </div>
      </div>

      <div class="kpi-card-luxury cashflow-card">
        <div class="kpi-icon">📊</div>
        <div class="kpi-info">
          <span class="kpi-label">FLUJO DE CAJA (NETO)</span>
          <h2 class="kpi-value" [class.negative]="(data()?.gananciaNeta || 0) < 0">
            {{data()?.gananciaNeta | currency:'COP':'symbol':'1.0-0'}}
          </h2>
        </div>
      </div>
    </div>

    <!-- SECCIÓN DE GRÁFICAS DE DISTRIBUCIÓN -->
    <div class="charts-grid-triple" *ngIf="data()">
       <mat-card class="luxury-table-card chart-card">
          <mat-card-header>
            <mat-card-title>Distribución de Ventas</mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas #catChart></canvas>
          </mat-card-content>
       </mat-card>

       <mat-card class="luxury-table-card chart-card">
          <mat-card-header>
            <mat-card-title>Distribución de Ganancias</mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas #profitChart></canvas>
          </mat-card-content>
       </mat-card>

       <mat-card class="luxury-table-card chart-card">
          <mat-card-header>
            <mat-card-title>Distribución de Gastos</mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas #expChart></canvas>
          </mat-card-content>
       </mat-card>
    </div>

    <!-- BALANCE Y TOP PRODUCTOS -->
    <div class="charts-grid" *ngIf="data()">
       <mat-card class="luxury-table-card chart-card">
          <mat-card-header>
            <mat-card-title>Balance Ingresos vs Egresos</mat-card-title>
          </mat-card-header>
          <mat-card-content class="chart-content">
            <canvas #compChart></canvas>
          </mat-card-content>
       </mat-card>

       <mat-card class="luxury-table-card top-products">
          <mat-card-header>
            <mat-card-title>Top Productos Vendidos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="table-container">
              <table class="premium-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th class="text-right">Unidades</th>
                    <th>Popularidad</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of productosMasVendidos(); let i = index">
                    <td><span class="rank-badge">{{i + 1}}</span></td>
                    <td>{{item.nombre}}</td>
                    <td class="text-right">{{item.cantidad}}</td>
                    <td class="progress-col">
                       <div class="progress-bar-small">
                          <div class="progress-fill" [style.width.%]="(item.cantidad / (productosMasVendidos()[0].cantidad || 1)) * 100"></div>
                       </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div *ngIf="productosMasVendidos().length === 0" class="empty-state">
               No hay ventas registradas en este período.
            </div>
          </mat-card-content>
       </mat-card>
    </div>

    <!-- TABLES SECTION (REPLACING CHARTS) -->
    <div class="charts-grid" *ngIf="data()">
      <mat-card class="chart-card table-summary-card">
        <mat-card-header>
          <div class="chart-title-group">
            <span class="chart-emoji">📊</span>
            <mat-card-title>Ventas por Categoría</mat-card-title>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="mini-table-container">
            <table class="premium-table mini">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of ventasPorCategoria()">
                  <td class="category-name">{{item.nombre}}</td>
                  <td class="text-right">{{item.monto | currency:'COP':'symbol':'1.0-0'}}</td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="ventasPorCategoria().length === 0" class="empty-state-mini">Sin datos</div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="chart-card table-summary-card">
        <mat-card-header>
          <div class="chart-title-group">
            <span class="chart-emoji">💰</span>
            <mat-card-title>Ganancias por Categoría</mat-card-title>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="mini-table-container">
            <table class="premium-table mini">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th class="text-right">Ganancia</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of gananciasPorCategoria()">
                  <td class="category-name green">{{item.nombre}}</td>
                  <td class="text-right green">{{item.monto | currency:'COP':'symbol':'1.0-0'}}</td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="gananciasPorCategoria().length === 0" class="empty-state-mini">Sin datos</div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="chart-card table-summary-card">
        <mat-card-header>
          <div class="chart-title-group">
            <span class="chart-emoji">💸</span>
            <mat-card-title>Gastos por Categoría</mat-card-title>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="mini-table-container">
            <table class="premium-table mini">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th class="text-right">Gasto</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of gastosPorCategoria()">
                  <td class="category-name red">{{item.nombre}}</td>
                  <td class="text-right red">{{item.monto | currency:'COP':'symbol':'1.0-0'}}</td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="gastosPorCategoria().length === 0" class="empty-state-mini">Sin datos</div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- EXPENSE DETAILS -->
    <div class="bottom-grid" *ngIf="data()">
        <mat-card class="luxury-table-card expense-details">
          <mat-card-header>
            <mat-card-title>Desglose Jerárquico de Gastos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="table-container">
              <div *ngFor="let group of gastosJerarquicos()" class="expense-group">
                <div class="expense-group-header">
                  <span class="expense-cat-name">{{group.categoria}}</span>
                  <span class="expense-cat-total">{{group.total | currency:'COP':'symbol':'1.0-0'}}</span>
                </div>
                <div *ngFor="let sub of group.subItems" class="expense-sub-row">
                  <span class="expense-sub-name">{{sub.nombre}}</span>
                  <span class="expense-sub-monto">{{sub.monto | currency:'COP':'symbol':'1.0-0'}}</span>
                </div>
              </div>
              
              <table class="premium-table">
                <tfoot>
                  <tr class="total-row-final">
                    <td style="padding: 15px; font-weight: 800;">TOTAL GENERAL EGRESOS</td>
                    <td class="text-right" style="padding: 15px; font-weight: 800;">
                      {{(data()?.totalGastos || 0) + (data()?.totalSueldos || 0) | currency:'COP':'symbol':'1.0-0'}}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
    </div>

    <!-- VENTAS DETALLADAS -->
    <mat-card class="luxury-table-card full-width-card" *ngIf="data()">
       <mat-card-header>
         <div class="chart-title-group">
            <span class="chart-emoji">🧾</span>
            <mat-card-title>Historial Detallado de Ventas ({{data()?.detalleVentas?.length || 0}})</mat-card-title>
         </div>
       </mat-card-header>
       <mat-card-content>
          <div class="table-container">
             <table class="premium-table">
                <thead>
                   <tr>
                      <th style="color: var(--primary-pink)">Ref.</th>
                      <th style="color: var(--primary-pink)">Producto / Categoría</th>
                      <th>Fecha (Negocio/Reg)</th>
                      <th>Vendedor</th>
                      <th class="text-right">Total</th>
                   </tr>
                </thead>
                <tbody>
                   <tr *ngFor="let v of data()?.detalleVentas">
                      <td>
                         <div *ngFor="let d of v.detalles">
                            <span class="ref-text">{{d.productoReferencia}}</span>
                         </div>
                      </td>
                      <td>
                         <div *ngFor="let d of v.detalles" class="prod-info-mini">
                            <strong>{{d.productoNombre}}</strong>
                            <span class="cat-badge-mini" [style.background-color]="getCategoryColor(d.categoriaNombre)">
                               {{d.categoriaNombre}}
                            </span>
                         </div>
                      </td>
                      <td>
                         <div class="date-col">
                            <strong>{{(v.fechaRegistroManual || v.createdAt) | date:'dd/MM/yyyy'}}</strong><br>
                            <small>{{v.createdAt | date:'shortTime'}}</small>
                         </div>
                      </td>
                      <td><span class="user-pill">{{v.nombreVendedor || 'Vendedor'}}</span></td>
                      <td class="text-right">
                         <strong>{{v.total | currency:'COP':'symbol':'1.0-0'}}</strong>
                      </td>
                   </tr>
                </tbody>
             </table>
             <div *ngIf="data()?.detalleVentas?.length === 0" class="empty-state">No se encontraron ventas registradas en este periodo.</div>
          </div>
       </mat-card-content>
    </mat-card>

    <!-- FULL DETAILED EXPENSES TABLE -->
    <div class="bottom-grid" *ngIf="data() && data()?.detalleGastos">
      <mat-card class="luxury-table-card full-width-card">
        <mat-card-header>
          <mat-card-title>Historial Detallado de Egresos</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Descripción</th>
                  <th>Responsable/Origen</th>
                  <th class="text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let g of data()?.detalleGastos">
                  <td class="date-col">{{(g.fechaRegistroManual || g.createdAt) | date:'dd/MM/yyyy HH:mm'}}</td>
                  <td><span class="category-name">{{g.categoriaGastoNombre}}</span></td>
                  <td class="desc-col">{{g.descripcion}}</td>
                  <td><span class="user-pill">{{g.nombreUsuario || 'Admin'}}</span></td>
                  <td class="text-right monto-negativo">{{g.monto | currency:'COP':'symbol':'1.0-0'}}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .header-card {
      background: white;
      border-radius: 24px;
      padding: 20px;
      margin-bottom: 24px;
      border: 1px solid #eee;
      box-shadow: 0 10px 30px rgba(0,0,0,0.05);
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }
    .title-group h1 {
      margin: 0;
      font-weight: 800;
      background: linear-gradient(45deg, #C2185B, #E91E63);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .title-group p { margin: 0; color: #666; font-size: 14px; }
    
    .date-filter-group { display: flex; align-items: center; gap: 15px; flex-wrap: wrap; }
    .date-picker-single { width: 170px; }
    .date-picker-single ::ng-deep .mat-mdc-form-field-subscript-wrapper { display: none; }
    /* Fix datepicker visibility against white background */
    .date-picker-single ::ng-deep .mdc-text-field--outlined { background-color: #f8f9fa; border-radius: 8px; }
    .date-picker-single ::ng-deep .mdc-floating-label { color: #C2185B !important; font-weight: 600; }
    .date-picker-single ::ng-deep .mat-mdc-input-element { color: #333 !important; font-weight: 500; }
    .date-picker-single ::ng-deep .mat-datepicker-toggle { color: #C2185B !important; }
    .quick-filters { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-filter { background: #C2185B; color: white; border-radius: 12px; height: 50px; padding: 0 24px; }
    .kpi-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    @media (max-width: 1100px) {
      .kpi-container { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 600px) {
      .kpi-container { grid-template-columns: 1fr; }
    }
    .kpi-card-luxury {
      padding: 24px;
      border-radius: 24px;
      color: white;
      display: flex;
      align-items: center;
      gap: 15px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.1);
    }
    .sales-card { background: linear-gradient(135deg, #AD1457, #E91E63); }
    .expenses-card { background: linear-gradient(135deg, #D32F2F, #FF5252); }
    .profit-card { background: linear-gradient(135deg, #2E7D32, #4CAF50); }
    .cashflow-card { background: linear-gradient(135deg, #0288D1, #03A9F4); }
    .kpi-icon { font-size: 32px; background: rgba(255,255,255,0.2); padding: 10px; border-radius: 15px; }
    .kpi-label { font-size: 14px; font-weight: 700; opacity: 0.9; letter-spacing: 1px; }
    .kpi-value { font-size: 36px; font-weight: 800; margin: 0; letter-spacing: -1px; }
    .kpi-value.negative { color: #ffdada; }

    .charts-grid-triple {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 20px;
    }
    @media (max-width: 900px) {
      .charts-grid-triple { grid-template-columns: 1fr; }
    }
    .balance-container {
      display: flex;
      justify-content: center;
      margin-bottom: 25px;
    }
    .balance-card {
      width: 100%;
      max-width: 600px;
    }
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }
    .chart-card { min-height: 300px; display: flex; flex-direction: column; }
    .chart-content { flex: 1; position: relative; padding: 10px !important; max-height: 250px; }
    .full-width-chart { grid-column: 1 / -1; min-height: 350px; }
    canvas { width: 100% !important; height: 100% !important; max-height: 240px; }
    
    .chart-title-group { display: flex; align-items: center; gap: 12px; }
    .chart-emoji { font-size: 26px; }
    ::ng-deep mat-card-title { font-size: 22px !important; font-weight: 800 !important; }
    
    .mini-table-container { padding: 10px 15px; }
    .empty-state-mini { padding: 20px; text-align: center; color: #ccc; font-size: 12px; }

    .bottom-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
      gap: 25px;
    }
    .luxury-table-card { border-radius: 24px; border: 1px solid #f0f0f0; }
    .table-container { padding: 0 15px 15px; overflow-x: auto; }
    .cat-badge-mini {
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 8px;
      color: white;
      font-weight: 700;
      text-transform: uppercase;
      margin-left: 5px;
    }
    .prod-info-mini {
      display: flex;
      align-items: center;
      margin-bottom: 2px;
      white-space: nowrap;
    }
    .total-col {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }
    .subtle-text { color: #999; font-size: 12px; }
    .premium-table { width: 100%; border-collapse: collapse; }
    .premium-table th { text-align: left; padding: 18px 12px; border-bottom: 2px solid #f8f9fa; color: #888; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .premium-table td { padding: 16px 12px; border-bottom: 1px solid #fcfcfc; font-weight: 600; color: #333; font-size: 16px; }
    .premium-table.mini td { padding: 12px; font-size: 15px; }
    
    .text-right { text-align: right; }
    .monto-negativo { color: #d32f2f; }
    .category-name { color: #C2185B; font-weight: 700; }
    .category-name.green { color: #2E7D32; }
    .category-name.red { color: #D32F2F; }
    .green { color: #2E7D32 !important; }
    .red { color: #D32F2F !important; }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: #f0f0f0;
      color: #777;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 800;
    }
    tr:nth-child(1) .rank-badge { background: #FFD700; color: #856404; }
    tr:nth-child(2) .rank-badge { background: #C0C0C0; color: #383d41; }
    tr:nth-child(3) .rank-badge { background: #CD7F32; color: #721c24; }

    .progress-bar-small { width: 100%; min-width: 80px; height: 8px; background: #f0f0f0; border-radius: 10px; overflow: hidden; margin-left: auto; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #E91E63, #FF80AB); border-radius: 10px; }
    .progress-fill.expense { background: #FF5252; }

    .total-row td { background: #fffafb; font-weight: 800; color: #C2185B; border-top: 2px solid #C2185B; }
    .empty-state { padding: 40px; text-align: center; color: #999; font-style: italic; }

    .full-width-card { margin-top: 25px; margin-bottom: 25px; grid-column: 1 / -1; }
    .user-pill {
      background: #f3e5f5;
      color: #7b1fa2;
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }
    .date-col { color: #888; font-size: 14px; }
    .desc-col { max-width: 300px; white-space: normal; line-height: 1.4; color: #555; }

    .expense-group { margin-bottom: 8px; border-bottom: 1px solid #f5f5f5; padding-bottom: 8px; }
    .expense-group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 10px;
      background: #fff5f7;
      border-radius: 10px;
      margin-bottom: 4px;
    }
    .expense-cat-name { font-weight: 800; color: #C2185B; font-size: 14px; }
    .expense-cat-total { font-weight: 800; color: #d32f2f; font-size: 14px; }
    .expense-sub-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 10px 8px 35px;
      border-bottom: 1px solid #fafafa;
    }
    .expense-sub-name { color: #555; font-weight: 600; font-size: 13px; }
    .expense-sub-name::before { content: '└  '; color: #ccc; }
    .expense-sub-monto { color: #d32f2f; font-weight: 600; font-size: 13px; }
    .total-row-final {
      background: linear-gradient(135deg, #fce4ec, #fff5f7) !important;
      border-top: 2px solid #C2185B;
      margin-top: 10px;
    }

    ::ng-deep .white-datepicker { 
      background: #ffffff !important; 
      border-radius: 16px !important; 
      overflow: visible !important; 
      box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important;
      border: 1px solid #e0e0e0 !important;
      padding: 8px !important;
    }
    ::ng-deep .white-datepicker .mat-calendar { 
      background: #ffffff !important; 
    }
    ::ng-deep .white-datepicker .mat-calendar-header {
      color: #333 !important;
    }
    ::ng-deep .white-datepicker .mat-calendar-body-cell-content { 
      color: #333333 !important; 
      border-radius: 8px !important;
    }
    ::ng-deep .white-datepicker .mat-calendar-table-header { 
      color: #999 !important; 
    }
    ::ng-deep .white-datepicker .mat-calendar-body-selected { 
      background-color: #C2185B !important; 
      color: white !important; 
      font-weight: bold; 
    }
    ::ng-deep .white-datepicker .mat-calendar-body-today:not(.mat-calendar-body-selected) { 
      border-color: #C2185B !important; 
    }
    ::ng-deep .white-datepicker .mat-calendar-period-button { 
      color: #C2185B !important; 
      font-weight: 800 !important; 
    }
    ::ng-deep .white-datepicker .mat-calendar-arrow { 
      fill: #C2185B !important; 
    }
    /* Selectores para botones de navegación MDC */
    ::ng-deep .white-datepicker .mat-mdc-button,
    ::ng-deep .white-datepicker .mat-mdc-icon-button {
      color: #C2185B !important;
    }
    ::ng-deep .white-datepicker .mat-calendar-previous-button,
    ::ng-deep .white-datepicker .mat-calendar-next-button {
      color: #C2185B !important;
      opacity: 1 !important;
    }
  `]
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

  public getCategoryColor(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('niña')) return '#ec407a';
    if (n.includes('mujer')) return '#7b1fa2';
    if (n.includes('niño')) return '#03a9f4';
    if (n.includes('hombre')) return '#0d47a1';
    // Colores por defecto para otras categorías
    const others = ['#ff9800', '#ffeb3b', '#4caf50', '#009688', '#673ab7'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return others[hash % others.length];
  }

  ngOnDestroy() {
    this.destroyCharts();
    this.routerSub?.unsubscribe();
  }

  private destroyCharts() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }
  
  data = signal<DashboardResponse | null>(null);
  loading = false;
  today = new Date();

  range = new FormGroup({
    start: new FormControl<Date | null>(new Date(new Date().setDate(1))),
    end: new FormControl<Date | null>(new Date())
  });

  ngOnInit() {
    // Recargar el reporte cada vez que el usuario navega a esta pantalla
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.today = new Date();
      this.range.patchValue({ end: new Date() });
      this.cargarReporte();
    });
    this.cargarReporte();
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

  ventasPorCategoria() {
    const list = this.data()?.ventasPorCategoria || {};
    return Object.entries(list).map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto);
  }

  gananciasPorCategoria() {
    const list = this.data()?.gananciasPorCategoria || {};
    return Object.entries(list).map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto);
  }

  gastosPorCategoria() {
    const list = this.data()?.gastosPorCategoria || {};
    return Object.entries(list).map(([nombre, monto]) => ({ nombre, monto }))
      .sort((a, b) => b.monto - a.monto);
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

  private initCharts() {
    this.zone.runOutsideAngular(() => {
      this.destroyCharts();
      const d = this.data();
      if (!d) return;

      // Chart 1: Ventas por Categoría
      if (this.catChartRef) {
        const ctx = this.catChartRef.nativeElement.getContext('2d');
        if (ctx) {
          const labels = Object.keys(d.ventasPorCategoria);
          this.charts.push(new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: labels,
              datasets: [{
                data: Object.values(d.ventasPorCategoria),
                backgroundColor: labels.map(l => this.getCategoryColor(l))
              }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
          }));
        }
      }

      // Chart 2: Ganancias por Categoría
      if (this.profitChartRef) {
        const ctx = this.profitChartRef.nativeElement.getContext('2d');
        if (ctx) {
          const labels = Object.keys(d.gananciasPorCategoria);
          this.charts.push(new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: labels,
              datasets: [{
                data: Object.values(d.gananciasPorCategoria),
                backgroundColor: labels.map(l => this.getCategoryColor(l))
              }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
          }));
        }
      }

      // Chart 3: Gastos por Categoría
      if (this.expChartRef) {
        const ctx = this.expChartRef.nativeElement.getContext('2d');
        if (ctx) {
          this.charts.push(new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: Object.keys(d.gastosPorCategoria),
              datasets: [{
                data: Object.values(d.gastosPorCategoria),
                // Paleta variada para distinguir categorías de gasto (Nómina, Servicios, etc.)
                backgroundColor: ['#f44336', '#ff9800', '#ffeb3b', '#795548', '#607d8b', '#9e9e9e']
              }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } } }
          }));
        }
      }

      // Chart 4: Balance Ingresos vs Egresos
      if (this.compChartRef) {
        const ctx = this.compChartRef.nativeElement.getContext('2d');
        if (ctx) {
          this.charts.push(new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['Ingresos', 'Egresos'],
              datasets: [{
                label: 'Pesos ($)',
                data: [d.totalVentas, d.totalGastos + d.totalSueldos],
                backgroundColor: ['#4CAF50', '#F44336'],
                borderRadius: 20, // Más redondeado
                barThickness: 50
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: { 
                y: { 
                   beginAtZero: true, 
                   grid: { display: true, color: '#f5f5f5' },
                   border: { display: false }
                }, 
                x: { 
                   grid: { display: false },
                   border: { display: false }
                } 
              },
              plugins: { legend: { display: false } }
            }
          }));
        }
      }
    });
  }
}
