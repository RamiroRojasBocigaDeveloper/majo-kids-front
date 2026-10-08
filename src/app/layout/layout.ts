import { Component, inject, HostListener, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../auth/auth';
import { MatDialogModule, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SesionTrabajoService } from '../sesiones-trabajo/sesion-trabajo';
import { ResumenCierreDialog } from '../sesiones-trabajo/sesiones-trabajo';
import { ProductoService, Producto } from '../productos/producto';
import { SuccessDialog } from '../shared/success-dialog';
import { ToastService } from '../shared/toast.service';

@Component({
  selector: 'app-confirm-logout-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  template: `
    <div class="dialog-wrapper">
      <div class="dialog-icon">⚠️</div>
      <h2 class="dialog-title">¡Tienes la Caja Abierta!</h2>
      <p class="dialog-subtitle">Tu caja registradora sigue activa. ¿Qué deseas hacer antes de salir?</p>

      <div class="dialog-options">
        <button class="opt-btn opt-danger" (click)="dialogRef.close('CERRAR_CAJA')">
          <mat-icon>lock</mat-icon>
          <span>
            <strong>Cerrar Caja y Salir</strong>
            <small>Cierra la caja y finaliza tu sesión</small>
          </span>
        </button>

        <button class="opt-btn opt-neutral" (click)="dialogRef.close('SOLO_SALIR')">
          <mat-icon>logout</mat-icon>
          <span>
            <strong>Solo Cerrar Sesión</strong>
            <small>La caja queda abierta hasta mañana</small>
          </span>
        </button>

        <button class="opt-btn opt-cancel" (click)="dialogRef.close('CANCELAR')">
          <mat-icon>arrow_back</mat-icon>
          <span>
            <strong>Cancelar</strong>
            <small>Volver a la aplicación</small>
          </span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-wrapper { padding: 24px; text-align: center; }
    .dialog-icon { font-size: 3rem; margin-bottom: 8px; }
    .dialog-title { font-size: 1.5rem; font-weight: 800; color: #c62828; margin: 0 0 8px 0; }
    .dialog-subtitle { color: #555; margin: 0 0 24px 0; font-size: 0.95rem; }
    .dialog-options { display: flex; flex-direction: column; gap: 12px; }
    .opt-btn {
      display: flex; align-items: center; gap: 16px;
      padding: 14px 20px; border-radius: 12px; border: 2px solid transparent;
      cursor: pointer; text-align: left; width: 100%; transition: all 0.2s;
      background: #f5f5f5;
    }
    .opt-btn mat-icon { font-size: 1.8rem; width: 1.8rem; height: 1.8rem; flex-shrink: 0; }
    .opt-btn span { display: flex; flex-direction: column; }
    .opt-btn strong { font-size: 1rem; font-weight: 700; }
    .opt-btn small { font-size: 0.78rem; color: #777; margin-top: 2px; }
    .opt-danger { background: #fff3f3; border-color: #ef9a9a; color: #c62828; }
    .opt-danger:hover { background: #ffebee; border-color: #c62828; transform: translateY(-1px); }
    .opt-danger mat-icon { color: #c62828; }
    .opt-neutral { background: #f3f6ff; border-color: #90a4e8; color: #283593; }
    .opt-neutral:hover { background: #e8eaf6; border-color: #283593; transform: translateY(-1px); }
    .opt-neutral mat-icon { color: #3949ab; }
    .opt-cancel { background: #f9f9f9; border-color: #e0e0e0; color: #555; }
    .opt-cancel:hover { background: #f0f0f0; border-color: #aaa; transform: translateY(-1px); }
    .opt-cancel mat-icon { color: #777; }
  `]
})
export class ConfirmLogoutDialog {
  constructor(public dialogRef: MatDialogRef<ConfirmLogoutDialog>) {}
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatDialogModule
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #drawer class="sidenav" fixedInViewport
          [attr.role]="'navigation'"
          [mode]="isMobile ? 'over' : 'side'"
          [opened]="!isMobile">
        <mat-toolbar color="primary">Menú</mat-toolbar>
        <mat-nav-list>
          <a mat-list-item routerLink="/ventas" routerLinkActive="active-link" (click)="cerrarMenuSiEsCelular(drawer)">
            <mat-icon matListItemIcon>shopping_cart</mat-icon>
            <span matListItemTitle>Ventas (TPV)</span>
          </a>
          <a mat-list-item routerLink="/sesiones-trabajo" routerLinkActive="active-link" *ngIf="isAdmin() || isJefe()" (click)="cerrarMenuSiEsCelular(drawer)">
            <mat-icon matListItemIcon>point_of_sale</mat-icon>
            <span matListItemTitle>Historial de Caja</span>
          </a>
          <a mat-list-item routerLink="/inventario" routerLinkActive="active-link" (click)="cerrarMenuSiEsCelular(drawer)">
            <mat-icon matListItemIcon
              [matBadge]="stockBajoCount() > 0 ? stockBajoCount() : null"
              matBadgeColor="warn"
              matBadgeSize="small"
              [matBadgeHidden]="stockBajoCount() === 0">inventory_2</mat-icon>
            <span matListItemTitle>Inventario</span>
          </a>

          <a mat-list-item routerLink="/categorias" routerLinkActive="active-link" *ngIf="isAdmin() || isJefe()" (click)="cerrarMenuSiEsCelular(drawer)">
            <mat-icon matListItemIcon>category</mat-icon>
            <span matListItemTitle>Categorías</span>
          </a>
          <a mat-list-item routerLink="/gastos" routerLinkActive="active-link" *ngIf="isAdmin() || isVendedor() || isJefe()" (click)="cerrarMenuSiEsCelular(drawer)">
            <mat-icon matListItemIcon>payments</mat-icon>
            <span matListItemTitle>Gastos</span>
          </a>
          <a mat-list-item routerLink="/reportes" routerLinkActive="active-link" *ngIf="isAdmin() || isJefe()" (click)="cerrarMenuSiEsCelular(drawer)">
            <mat-icon matListItemIcon>assessment</mat-icon>
            <span matListItemTitle>Reportes</span>
          </a>
          <a mat-list-item routerLink="/usuarios" routerLinkActive="active-link" *ngIf="isAdmin()" (click)="cerrarMenuSiEsCelular(drawer)">
            <mat-icon matListItemIcon>people</mat-icon>
            <span matListItemTitle>Usuarios</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>
      
      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <button type="button" aria-label="Toggle sidenav" mat-icon-button (click)="drawer.toggle()">
            <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
          </button>
          <span class="toolbar-title">MajoKids <span class="user-badge">{{ getNombreUsuario() }}</span></span>
          <span class="spacer"></span>
          <button mat-flat-button class="logout-btn-premium" (click)="logout()">
            <mat-icon>power_settings_new</mat-icon> <span>SALIR</span>
          </button>
        </mat-toolbar>
        
        <div class="main-content">
          <!-- Banner de alerta de stock bajo -->
          <div class="stock-alert-banner" *ngIf="stockBajoCount() > 0 && mostrarAlertaStock">
            <mat-icon>warning</mat-icon>
            <span>
              <strong>{{ stockBajoCount() }} producto(s) con stock bajo:</strong>
              {{ nombresStockBajo() }}
            </span>
            <div class="alert-actions">
              <a routerLink="/inventario" class="alert-link">Ver inventario</a>
              <button class="alert-close" (click)="mostrarAlertaStock = false">✕</button>
            </div>
          </div>
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container {
      height: 100vh;
      background-color: var(--bg-main);
    }
    .sidenav {
      width: 280px;
      border-right: 1px solid var(--border-color);
      background-color: var(--bg-card);
      box-shadow: 10px 0 30px rgba(0, 0, 0, 0.02);
    }
    .spacer {
      flex: 1 1 auto;
    }
    .main-content {
      padding: 30px;
      background-color: var(--bg-main);
      min-height: calc(100vh - 64px);
    }
    .toolbar-title {
      font-weight: 800;
      letter-spacing: -0.5px;
      font-size: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .user-badge {
      font-size: 12px;
      background: rgba(255, 255, 255, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
      font-weight: 400;
      letter-spacing: 0;
    }
    .active-link {
      background-color: var(--primary-pink) !important;
      color: white !important;
      font-weight: 700 !important;
      box-shadow: 0 4px 15px rgba(216, 27, 96, 0.2);
    }
    .active-link mat-icon {
      color: white !important;
    }
    mat-toolbar {
      background: var(--vibrant-gradient) !important;
      color: white !important;
      box-shadow: 0 4px 20px rgba(216, 27, 96, 0.15);
    }
    mat-nav-list a {
      margin: 8px 16px;
      border-radius: 12px;
      color: var(--dark-text) !important;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      height: 52px !important;
      font-weight: 500;
    }
    /* Forzar el color del texto interno provisto por Material */
    mat-nav-list a .mdc-list-item__primary-text,
    mat-nav-list a span[matListItemTitle] {
      color: var(--dark-text) !important;
    }
    .active-link .mdc-list-item__primary-text,
    .active-link span[matListItemTitle] {
      color: white !important;
    }
    mat-nav-list a:hover {
      background-color: rgba(216, 27, 96, 0.05);
      color: var(--primary-pink) !important;
      transform: translateX(5px);
    }
    mat-nav-list a:hover .mdc-list-item__primary-text,
    mat-nav-list a:hover span[matListItemTitle] {
      color: var(--primary-pink) !important;
    }
    mat-nav-list a:hover mat-icon {
      color: var(--primary-pink) !important;
    }
    /* Estilo para el link activo cuando se pasa el mouse (evita que desaparezca el texto) */
    mat-nav-list a.active-link:hover {
      background-color: var(--primary-pink) !important;
      cursor: default;
      transform: none;
    }
    mat-nav-list a.active-link:hover .mdc-list-item__primary-text,
    mat-nav-list a.active-link:hover span[matListItemTitle],
    mat-nav-list a.active-link:hover mat-icon {
      color: #e0e0e0 !important; /* Gris claro para indicar que ya está seleccionado */
    }
    mat-icon[matListItemIcon] {
      color: var(--subtle-text);
      margin-right: 16px !important;
    }
    .stock-alert-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff8e1;
      border: 1px solid #ffe082;
      border-left: 4px solid #f9a825;
      padding: 12px 16px;
      border-radius: 10px;
      margin-bottom: 20px;
      color: #5d4037;
      font-size: 14px;
      flex-wrap: wrap;
    }
    .stock-alert-banner mat-icon { color: #f9a825; flex-shrink: 0; }
    .stock-alert-banner span { flex: 1; }
    .alert-actions { display: flex; align-items: center; gap: 12px; }
    .alert-link {
      color: #e65100;
      font-weight: 700;
      text-decoration: none;
      border-bottom: 1px dashed #e65100;
    }
    .alert-link:hover { color: #bf360c; }
    .alert-close {
      background: none;
      border: none;
      cursor: pointer;
      color: #888;
      font-size: 16px;
      padding: 2px 6px;
      border-radius: 4px;
    }
    .alert-close:hover { background: #eee; color: #555; }
    
    .logout-btn-premium {
      background: rgba(255,255,255,0.15) !important;
      color: white !important;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 12px;
      padding: 0 20px;
      font-weight: 700;
      height: 40px;
      transition: all 0.3s;
    }
    .logout-btn-premium:hover {
      background: #f44336 !important;
      border-color: #f44336;
      box-shadow: 0 4px 15px rgba(244, 67, 54, 0.4);
    }
    .logout-btn-premium mat-icon { margin-right: 8px; font-size: 20px; }
  `]
})
export class Layout implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private sesionService = inject(SesionTrabajoService);
  private toast = inject(ToastService);
  private productoService = inject(ProductoService);

  isMobile = false;
  mostrarAlertaStock = true;
  productosConStockBajo = signal<Producto[]>([]);

  stockBajoCount = () => this.productosConStockBajo().length;

  nombresStockBajo = () => {
    const lista = this.productosConStockBajo();
    const nombres = lista.slice(0, 3).map(p => p.nombre).join(', ');
    return lista.length > 3 ? `${nombres}... y ${lista.length - 3} más` : nombres;
  };

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnInit() {
    this.isMobile = window.innerWidth <= 768;
    this.cargarStockBajo();
  }

  cargarStockBajo() {
    this.productoService.obtenerStockBajo().subscribe({
      next: (data) => this.productosConStockBajo.set(data),
      error: () => {} // silencioso
    });
  }

  cerrarMenuSiEsCelular(drawer: any) {
    if (this.isMobile) {
      drawer.close();
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isVendedor(): boolean {
    return this.authService.isVendedor();
  }

  isJefe(): boolean {
    return this.authService.isJefe();
  }

  getNombreUsuario(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.nombre : 'Usuario';
  }

  logout() {
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.ejecutarLogout();
      return;
    }

    // Verificar si hay sesión activa antes de salir
    this.sesionService.obtenerSesionActiva(user.id).subscribe({
      next: (sesion) => {
        if (sesion && sesion.estado?.toUpperCase() === 'ABIERTA') {
          // Abrir el diálogo espectacular
          const dialogRef = this.dialog.open(ConfirmLogoutDialog, {
            width: '450px',
            disableClose: true
          });

          dialogRef.afterClosed().subscribe(result => {
            if (result === 'CERRAR_CAJA') {
              // 1. Obtener resumen antes de cerrar
              this.sesionService.obtenerResumenCierre(sesion.id).subscribe({
                next: (resumen) => {
                  const resumenRef = this.dialog.open(ResumenCierreDialog, {
                    width: '450px',
                    disableClose: true,
                    data: resumen
                  });

                  resumenRef.afterClosed().subscribe(confirm => {
                    if (confirm) {
                      // Cerramos caja y salimos con feedback
                      this.toast.info('Finalizando sesión y cerrando caja...', 'Procesando');
                      
                      this.sesionService.cerrarSesion(sesion.id).subscribe({
                        next: () => {
                          this.toast.dismissAll();
                          this.toast.success('Caja cerrada con éxito. ¡Hasta pronto!', '¡Hasta pronto!');
                          this.ejecutarLogout();
                        },
                        error: (err: any) => {
                          console.error('Error cerrando caja:', err);
                          this.toast.dismissAll();
                          
                          let serverMessage = 'Error desconocido';
                          if (err.error && typeof err.error === 'string') {
                            serverMessage = err.error;
                          } else if (err.message) {
                            serverMessage = err.message;
                          }

                          this.toast.error(`No se pudo cerrar la caja: ${serverMessage}. Cerrando sesión por seguridad.`, 'Error');
                          this.ejecutarLogout();
                        }
                      });
                    }
                  });
                },
                error: (err) => {
                  this.toast.error('No se pudo generar el resumen de cierre.', 'Error');
                }
              });
            } else if (result === 'SOLO_SALIR') {
              this.ejecutarLogout();
            }
          });
        } else {
          // Si la caja ya está cerrada, pedimos una confirmación simple pero bonita
          this.confirmarLogout();
        }
      },
      error: () => {
        // Si hay error (No tiene caja abierta), simplemente salimos con confirmación
        this.confirmarLogout();
      }
    });
  }

  private confirmarLogout() {
    const dialogRef = this.dialog.open(SuccessDialog, {
      width: '420px',
      disableClose: true,
      data: {
        icon: '👋',
        title: 'Cerrar Sesión',
        message: '¿Estás seguro de que deseas cerrar sesión?',
        btnText: 'Sí, salir',
        btnIcon: 'logout',
        showCancel: true
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.ejecutarLogout();
      }
    });
  }

  private ejecutarLogout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
