import { Routes } from '@angular/router';
import { Layout } from './layout/layout';
import { authGuard } from './auth/auth-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login)
  },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      {
        path: 'ventas',
        loadComponent: () => import('./ventas/ventas').then(m => m.Ventas)
      },
      {
        path: 'categorias',
        loadComponent: () => import('./categorias/categorias').then(m => m.Categorias),
        data: { expectedRoles: ['ADMINISTRADOR', 'JEFE'] }
      },
      {
        path: 'inventario',
        loadComponent: () => import('./inventario/inventarios').then(m => m.Inventarios)
      },
      {
        path: 'gastos',
        loadComponent: () => import('./gastos/gastos').then(m => m.Gastos)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./reportes/reportes').then(m => m.Reportes),
        data: { expectedRoles: ['ADMINISTRADOR', 'JEFE'] }
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./usuarios/usuarios').then(m => m.Usuarios),
        data: { expectedRoles: ['ADMINISTRADOR'] }
      },
      {
        path: 'sesiones-trabajo',
        loadComponent: () => import('./sesiones-trabajo/sesiones-trabajo').then(m => m.SesionesTrabajo)
      },
      { path: '', redirectTo: 'ventas', pathMatch: 'full' }
    ]
  }
];
