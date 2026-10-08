import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { GastoService, Gasto } from './gasto';
import { GastoDialog } from './gasto-dialog/gasto-dialog';
import { AuthService } from '../auth/auth';
import { SesionTrabajoService } from '../sesiones-trabajo/sesion-trabajo';
import { SuccessDialog } from '../shared/success-dialog';
import { ToastService } from '../shared/toast.service';


@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  template: `
    <mat-card class="header-card">
      <div class="header-content">
        <div class="title-group">
          <h1>Gestión de Gastos</h1>
          <p>Registra salidas de dinero como nómina, servicios y compras locales</p>
        </div>
        <button mat-raised-button color="warn" class="add-gasto-btn" (click)="abrirDialogoGasto()">
          <mat-icon>add_circle</mat-icon> REGISTRAR NUEVO GASTO
        </button>
      </div>
    </mat-card>

    <mat-card class="luxury-card">
      <mat-card-content>
        <table mat-table [dataSource]="gastos()" class="full-width">
          <ng-container matColumnDef="fecha">
            <th mat-header-cell *matHeaderCellDef> Fechas (Negocio / Registro) </th>
            <td mat-cell *matCellDef="let g"> 
              <div class="date-container">
                <span class="hist-date" title="Fecha de Negocio">{{(g.fechaRegistroManual || g.createdAt) | date:'dd/MM/yyyy'}}</span>
                <span class="system-date" title="Fecha de Registro en Sistema">{{g.createdAt | date:'shortTime'}} ({{g.createdAt | date:'dd/MM'}})</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="descripcion">
            <th mat-header-cell *matHeaderCellDef> Descripción </th>
            <td mat-cell *matCellDef="let g"> {{g.descripcion}} </td>
          </ng-container>

          <ng-container matColumnDef="categoria">
            <th mat-header-cell *matHeaderCellDef> Categoría </th>
            <td mat-cell *matCellDef="let g"> 
              {{g.categoriaGastoNombre || 'General'}} 
              <span *ngIf="g.subcategoriaGastoNombre" class="sub-badge">({{g.subcategoriaGastoNombre}})</span>
            </td>
          </ng-container>

          <ng-container matColumnDef="monto">
            <th mat-header-cell *matHeaderCellDef> Monto </th>
            <td mat-cell *matCellDef="let g" class="monto-cell"> 
              {{g.monto | currency:'COP'}} 
            </td>
          </ng-container>

          <ng-container matColumnDef="usuario">
            <th mat-header-cell *matHeaderCellDef> Autor </th>
            <td mat-cell *matCellDef="let g"> {{g.nombreUsuario}} </td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef> - </th>
            <td mat-cell *matCellDef="let g">
              <button mat-icon-button color="warn" (click)="eliminar(g.id)" *ngIf="isAdmin()">
                <mat-icon>delete_outline</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>

        <div *ngIf="loading" class="loading-state">
          Cargando gastos...
        </div>

        <div *ngIf="!loading && gastos().length === 0" class="empty-state">
          <mat-icon>payments</mat-icon>
          <p>No hay gastos registrados.</p>
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
    .luxury-card {
      border-radius: 20px;
      box-shadow: var(--luxury-shadow);
      border: 1px solid var(--border-color);
    }
    .full-width { width: 100%; }
    .monto-cell {
      font-weight: 700;
      color: #d32f2f;
    }
    .loading-state, .empty-state {
      padding: 60px;
      text-align: center;
      color: var(--subtle-text);
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 12px;
      opacity: 0.3;
    }
    ::ng-deep th.mat-mdc-header-cell {
      color: var(--primary-pink) !important;
      font-weight: 700 !important;
    }
    .sub-badge {
      margin-left: 4px;
      font-weight: 500;
    }
    .add-gasto-btn {
      padding: 25px 30px !important;
      font-weight: 800;
      border-radius: 12px;
      font-size: 15px;
      letter-spacing: 0.5px;
    }
    .date-container {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .hist-date {
      font-weight: 700;
      color: #333;
      font-size: 13px;
    }
    .system-date {
      font-size: 10px;
      color: #999;
      font-style: italic;
    }
  `]
})
export class Gastos implements OnInit {
  private gastoService = inject(GastoService);
  private authService = inject(AuthService);
  private sesionService = inject(SesionTrabajoService);
  private dialog = inject(MatDialog);
  private snackBar = inject(ToastService);
  private router = inject(Router);

  gastos = signal<Gasto[]>([]);
  loading = false;
  displayedColumns = ['fecha', 'descripcion', 'categoria', 'monto', 'usuario'];

  ngOnInit() {
    if (this.isAdmin()) {
      this.displayedColumns.push('acciones');
    }
    this.cargarGastos();
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  cargarGastos() {
    this.loading = true;
    this.gastoService.obtenerTodos().subscribe({
      next: (data) => {
        this.gastos.set(data);
        this.loading = false;
      },
      error: () => {
        this.snackBar.error('No se pudo cargar la lista de gastos.', 'Error');
        this.loading = false;
      }
    });
  }

  eliminar(id: number) {
    const dialogRef = this.dialog.open(SuccessDialog, {
      width: '420px',
      disableClose: true,
      data: {
        icon: '🗑️',
        title: 'Eliminar Gasto',
        message: '¿Estás seguro de eliminar este gasto? Esta acción no se puede deshacer.',
        btnText: 'Eliminar',
        btnIcon: 'delete',
        showCancel: true
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.gastoService.eliminar(id).subscribe({
          next: () => {
            this.snackBar.success('El registro de gasto se ha borrado correctamente.', 'Gasto eliminado');
            this.cargarGastos();
          },
          error: (err) => {
            this.snackBar.error(err.error?.message || 'No se pudo eliminar el gasto', 'Error');
          }
        });
      }
    });
  }

  abrirDialogoGasto() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    if (this.isAdmin()) {
      // Los administradores pueden abrir el diálogo directamente
      this.ejecutarAbrirDialogo(null);
    } else {
      this.loading = true;
      this.sesionService.obtenerSesionActiva(user.id).subscribe({
        next: (sesion) => {
          this.loading = false;
          this.ejecutarAbrirDialogo(sesion.id);
        },
        error: () => {
          this.loading = false;
          const dialogRef = this.dialog.open(SuccessDialog, {
            width: '420px',
            data: { 
              icon: '❌',
              title: 'Caja Cerrada', 
              titleColor: '#d32f2f',
              message: 'No puedes registrar gastos si tu caja no está abierta. ¿Quieres ir a la sección de ventas para abrir tu turno?',
              btnText: 'SÍ, IR A VENTAS',
              btnIcon: 'point_of_sale',
              showCancel: true
            }
          });

          dialogRef.afterClosed().subscribe(confirm => {
            if (confirm) {
              this.router.navigate(['/ventas']);
            }
          });
        }
      });
    }
  }

  private ejecutarAbrirDialogo(sesionId: number | null) {
    const dialogRef = this.dialog.open(GastoDialog, {
      width: '400px',
      data: { sesionId }
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        this.gastoService.crear(result).subscribe({
          next: () => {
            this.snackBar.success('El gasto se ha guardado correctamente.', 'Gasto registrado');
            this.cargarGastos();
          },
          error: (err) => {
            this.snackBar.error('No se pudo registrar el gasto: ' + (err.error?.message || 'Error del servidor'), 'Error');
          }
        });
      }
    });
  }
}
