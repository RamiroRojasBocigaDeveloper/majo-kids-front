import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type MetodoPagoCompra = 'EFECTIVO' | 'TRANSFERENCIA';

export interface DetalleCompra {
  productoId: number;
  productoNombre?: string;
  referencia?: string;
  cantidad: number;
  costoUnitario: number;
  subtotal?: number;
}

export interface CompraMercancia {
  id: number;
  fecha: string;
  proveedor?: string;
  descripcion?: string;
  metodoPago: MetodoPagoCompra;
  montoTotal: number;
  detallada: boolean;
  usuarioNombre?: string;
  createdAt: string;
  lineas: DetalleCompra[];
}

export interface DetalleCompraRequest {
  productoId: number;
  cantidad: number;
  costoUnitario: number;
  precioVenta?: number;
}

export interface CompraMercanciaRequest {
  fecha: string;
  proveedor?: string;
  descripcion?: string;
  metodoPago: MetodoPagoCompra;
  lineas: DetalleCompraRequest[];
}

@Injectable({ providedIn: 'root' })
export class CompraMercanciaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/compras-mercancia`;

  listar(): Observable<CompraMercancia[]> {
    return this.http.get<CompraMercancia[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<CompraMercancia> {
    return this.http.get<CompraMercancia>(`${this.apiUrl}/${id}`);
  }

  crear(request: CompraMercanciaRequest): Observable<CompraMercancia> {
    return this.http.post<CompraMercancia>(this.apiUrl, request);
  }
}
