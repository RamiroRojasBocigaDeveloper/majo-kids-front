import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SesionTrabajo {
  id: number;
  usuarioId: number;
  nombreUsuario: string;
  rolUsuario: string;
  horaInicio: string;
  horaFin: string;
  estado: string;
  createdAt: string;
}

export interface ResumenCierre {
  sesionId: number;
  totalVentas: number;
  totalGastos: number;
  saldoNeto: number;
}

@Injectable({
  providedIn: 'root'
})
export class SesionTrabajoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/sesiones`;

  abrirSesion(usuarioId: number): Observable<SesionTrabajo> {
    return this.http.post<SesionTrabajo>(`${this.apiUrl}/abrir/${usuarioId}`, {});
  }

  cerrarSesion(sesionId: number): Observable<SesionTrabajo> {
    return this.http.post<SesionTrabajo>(`${this.apiUrl}/cerrar/${sesionId}`, {});
  }

  obtenerSesionActiva(usuarioId: number): Observable<SesionTrabajo> {
    return this.http.get<SesionTrabajo>(`${this.apiUrl}/activa/${usuarioId}`);
  }

  obtenerHistorial(usuarioId: number): Observable<SesionTrabajo[]> {
    return this.http.get<SesionTrabajo[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }

  obtenerTodas(): Observable<SesionTrabajo[]> {
    return this.http.get<SesionTrabajo[]>(this.apiUrl);
  }

  obtenerResumenCierre(sesionId: number): Observable<ResumenCierre> {
    return this.http.get<ResumenCierre>(`${this.apiUrl}/${sesionId}/resumen`);
  }
}
