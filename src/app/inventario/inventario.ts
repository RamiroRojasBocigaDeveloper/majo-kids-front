import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface MovimientoInventarioRequest {
  productoId: number;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  referenciaId?: number;
}

export interface MovimientoInventarioResponse {
  id: number;
  productoNombre: string;
  tipo: TipoMovimiento;
  cantidad: number;
  motivo: string;
  fecha: string;
  nombreUsuario: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovimientoInventarioService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/inventario`;

  registrarMovimiento(request: MovimientoInventarioRequest): Observable<MovimientoInventarioResponse> {
    return this.http.post<MovimientoInventarioResponse>(`${this.apiUrl}/movimiento`, request);
  }

  obtenerHistorial(): Observable<MovimientoInventarioResponse[]> {
    return this.http.get<MovimientoInventarioResponse[]>(`${this.apiUrl}/historial`);
  }

  obtenerHistorialPorProducto(productoId: number): Observable<MovimientoInventarioResponse[]> {
    return this.http.get<MovimientoInventarioResponse[]>(`${this.apiUrl}/historial/producto/${productoId}`);
  }
}
