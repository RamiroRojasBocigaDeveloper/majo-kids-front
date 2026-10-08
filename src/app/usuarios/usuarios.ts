import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UsuarioService, Usuario } from './usuario';
import { UsuarioDialog } from './usuario-dialog/usuario-dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-icon">🔐</div>
      <h2 class="dialog-title">Resetear Contraseña</h2>
      <p class="dialog-subtitle">Ingresa la nueva contraseña para <strong>{{ data.nombre }}</strong></p>

      <mat-form-field appearance="outline" style="width: 100%;">
        <mat-label>Nueva Contraseña</mat-label>
        <input matInput [type]="mostrarPassword ? 'text' : 'password'" [(ngModel)]="nuevaPassword" placeholder="Mínimo 4 caracteres">
        <button mat-icon-button matSuffix (click)="mostrarPassword = !mostrarPassword" type="button">
          <mat-icon>{{ mostrarPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      </mat-form-field>

      <div class="dialog-actions">
        <button mat-stroked-button (click)="dialogRef.close()">Cancelar</button>
        <button mat-flat-button color="primary" [disabled]="nuevaPassword.length < 4" (click)="dialogRef.close(nuevaPassword)">
          <mat-icon>lock_reset</mat-icon> Guardar Nueva Contraseña
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-wrapper { padding: 24px; text-align: center; }
    .dialog-icon { font-size: 3rem; margin-bottom: 8px; }
    .dialog-title { font-size: 1.4rem; font-weight: 800; color: var(--primary-pink); margin: 0 0 8px 0; }
    .dialog-subtitle { color: #555; margin: 0 0 20px 0; font-size: 0.95rem; }
    .dialog-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
  `]
})
export class ResetPasswordDialog {
  dialogRef = inject(MatDialogRef<ResetPasswordDialog>);
  data = inject(MAT_DIALOG_DATA);
  nuevaPassword = '';
  mostrarPassword = false;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="header-card">
      <div class="header-content">
        <div class="title-group">
          <h1>Gestión de Usuarios</h1>
          <p>Administra los accesos, roles y sueldos de tu equipo de trabajo</p>
        </div>
        <button mat-fab color="primary" (click)="crear()" title="Nuevo Usuario">
          <mat-icon>person_add</mat-icon>
        </button>
      </div>
    </mat-card>

    <mat-card class="luxury-card">
      <mat-card-content>
        <table mat-table [dataSource]="usuarios()" class="full-width">
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Nombre </th>
            <td mat-cell *matCellDef="let u">
              <div class="user-cell">
                <mat-icon class="user-avatar">account_circle</mat-icon>
                <span>{{u.nombre}}</span>
              </div>
            </td>
          </ng-container>
 
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Email </th>
            <td mat-cell *matCellDef="let u" class="text-center"> {{u.email}} </td>
          </ng-container>
 
          <ng-container matColumnDef="rol">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Rol </th>
            <td mat-cell *matCellDef="let u" class="text-center">
              <mat-chip-set>
                <mat-chip [class]="getRolClass(u.rolNombre)">
                  {{ u.rolNombre || 'S/R' }}
                </mat-chip>
              </mat-chip-set>
            </td>
          </ng-container>
 
          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Estado </th>
            <td mat-cell *matCellDef="let u" class="text-center">
              <span [class.status-active]="u.activo" [class.status-inactive]="!u.activo">
                {{ u.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
          </ng-container>
 
          <ng-container matColumnDef="sueldo">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Sueldo Diario </th>
            <td mat-cell *matCellDef="let u" class="text-center"> {{u.sueldoDiario | currency:'COP':'symbol':'1.0-0'}} </td>
          </ng-container>
 
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="text-center"> Acciones </th>
            <td mat-cell *matCellDef="let u" class="text-center">
              <div class="action-buttons-group">
                <button mat-icon-button color="accent" (click)="actualizar(u)" matTooltip="Editar Usuario">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button [color]="u.activo ? 'warn' : 'primary'" (click)="toggleEstado(u)" [matTooltip]="u.activo ? 'Desactivar' : 'Activar'">
                  <mat-icon>{{ u.activo ? 'person_off' : 'person' }}</mat-icon>
                </button>
                <button mat-icon-button color="primary" (click)="resetearPassword(u)" matTooltip="Resetear Contraseña">
                  <mat-icon>lock_reset</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>
 
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        
        <div *ngIf="loading" class="loading-state">
          Cargando usuarios...
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .header-container { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .full-width { width: 100%; }
    .status-active { color: #2e7d32; font-weight: 800; background: #e8f5e9; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
    .status-inactive { color: #c62828; font-weight: 800; background: #ffebee; padding: 4px 12px; border-radius: 20px; font-size: 12px; }
    .loading-state { padding: 40px; text-align: center; color: var(--subtle-text); }
    ::ng-deep th.mat-mdc-header-cell {
      background: var(--bg-main) !important;
      color: var(--primary-pink) !important;
      font-weight: 800 !important;
      text-align: center !important;
      font-size: 15px !important;
    }
    .text-center { text-align: center !important; }
    ::ng-deep .mat-mdc-chip-set { justify-content: center; }
    .user-cell { display: flex; align-items: center; gap: 12px; }
    .user-avatar { color: var(--primary-pink); font-size: 32px; width: 32px; height: 32px; }
    .action-buttons-group { display: flex; gap: 4px; justify-content: center; }
    
    /* Roles Styles */
    .rol-admin { background-color: #d81b60 !important; color: #ffffff !important; font-weight: 700 !important; }
    .rol-vendedor { background-color: #1976d2 !important; color: #ffffff !important; font-weight: 700 !important; }
    .rol-jefe { background-color: #7b1fa2 !important; color: #ffffff !important; font-weight: 700 !important; }
    .rol-default { background-color: #757575 !important; color: #ffffff !important; font-weight: 700 !important; }
  `]
})
export class Usuarios implements OnInit {
  private usuarioService = inject(UsuarioService);
  private dialog = inject(MatDialog);
  private toast = inject(ToastService);

  usuarios = signal<Usuario[]>([]);
  loading = false;
  displayedColumns = ['nombre', 'email', 'rol', 'estado', 'sueldo', 'acciones'];

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.loading = true;
    this.usuarioService.obtenerTodos().subscribe({
      next: (data) => {
        this.usuarios.set(data);
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  actualizar(usuario: Usuario) {
    const dialogRef = this.dialog.open(UsuarioDialog, {
      width: '500px',
      data: usuario
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuarioService.actualizar(usuario.id!, result).subscribe({
          next: () => {
            this.toast.success(`Los datos de ${usuario.nombre} se han guardado correctamente.`, 'Usuario actualizado');
            this.cargarUsuarios();
          },
          error: (err) => this.toast.error('No se pudo actualizar el usuario.', 'Error')
        });
      }
    });
  }

  crear() {
    const dialogRef = this.dialog.open(UsuarioDialog, {
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.usuarioService.crear(result).subscribe({
          next: (nuevo) => {
            this.toast.success(`El usuario ${nuevo.nombre} ha sido registrado exitosamente.`, 'Usuario creado');
            this.cargarUsuarios();
          },
          error: (err) => this.toast.error('No se pudo crear el usuario.', 'Error')
        });
      }
    });
  }

  toggleEstado(usuario: Usuario) {
    if (usuario.id) {
      this.usuarioService.cambiarEstado(usuario.id, !usuario.activo).subscribe({
        next: () => {
          this.toast.success(`El usuario ${usuario.nombre} ahora está ${!usuario.activo ? 'Activo' : 'Inactivo'}.`, 'Estado cambiado');
          this.cargarUsuarios();
        },
        error: (err) => {
          const msg = err.error?.message || err.error || 'No se pudo cambiar el estado';
          this.toast.error(msg, 'Error');
        }
      });
    }
  }

  getRolClass(rolNombre: string | undefined): string {
    if (!rolNombre) return 'rol-default';
    const rol = rolNombre.toUpperCase();
    if (rol === 'ADMINISTRADOR') return 'rol-admin';
    if (rol === 'VENDEDOR') return 'rol-vendedor';
    if (rol === 'JEFE') return 'rol-jefe';
    return 'rol-default';
  }

  resetearPassword(usuario: Usuario) {
    const dialogRef = this.dialog.open(ResetPasswordDialog, {
      width: '420px',
      data: { nombre: usuario.nombre }
    });

    dialogRef.afterClosed().subscribe(nuevaPassword => {
      if (nuevaPassword && usuario.id) {
        this.usuarioService.resetearPassword(usuario.id, nuevaPassword).subscribe({
          next: () => {
            this.toast.success(`La contraseña de ${usuario.nombre} se ha reseteado correctamente.`, 'Contraseña actualizada');
          },
          error: () => {
            this.toast.error('No se pudo resetear la contraseña.', 'Error');
          }
        });
      }
    });
  }
}
