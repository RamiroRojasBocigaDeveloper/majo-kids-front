import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardResponse {
  totalVentas: number;
  totalGastos: number;
  totalSueldos: number;
  gananciaNeta: number;
  gananciaProductos: number;
  costoMercancia: number;
  cantidadVentas: number;
  ventasPorMetodoPago: { [key: string]: number };
  ventasPorCategoria: { [key: string]: number };
  gananciasPorCategoria: { [key: string]: number };
  gastosPorCategoria: { [key: string]: number };
  productosMasVendidos: { [key: string]: number };
  gastosDesglosados: { [categoria: string]: { [subItem: string]: number } };
  detalleGastos: GastoResponse[];
  detalleVentas: VentaResponse[];
}

export interface VentaResponse {
  id: number;
  numeroFactura: string;
  total: number;
  nombreVendedor: string;
  metodoPagoNombre: string;
  createdAt: string;
  fechaRegistroManual?: string;
  detalles: DetalleVentaResponse[];
}

export interface DetalleVentaResponse {
  productoNombre: string;
  productoReferencia: string;
  categoriaNombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotalItem: number;
}

export interface GastoResponse {
  id: number;
  monto: number;
  descripcion: string;
  categoriaGastoNombre: string;
  nombreUsuario: string;
  createdAt: string;
  fechaRegistroManual?: string;
}

export interface InversionProducto {
  productoId: number;
  referencia: string;
  nombre: string;
  cantidad: number;
  monto: number;
}

export interface EstadisticasInversionResponse {
  gastosOperativos: number;
  inversionMercanciaPeriodo: number;
  saldoInicialMercancia: number;
  inversionMercanciaTotal: number;
  totalInvertidoPeriodo: number;
  totalInvertidoAcumulado: number;
  gastosOperativosPorSubcategoria: { [subcategoria: string]: number };
  comprasPorProducto: InversionProducto[];
  productosConSaldoInicial: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/reportes`;

  obtenerGlobal(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard/global`);
  }

  obtenerPorSesion(sesionId: number): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard/sesion/${sesionId}`);
  }

  obtenerPorRango(inicio: string, fin: string): Observable<DashboardResponse> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fin', fin);
    return this.http.get<DashboardResponse>(`${this.apiUrl}/dashboard/rango`, { params });
  }

  obtenerInversionGlobal(): Observable<EstadisticasInversionResponse> {
    return this.http.get<EstadisticasInversionResponse>(`${this.apiUrl}/inversion/global`);
  }

  obtenerInversionPorRango(inicio: string, fin: string): Observable<EstadisticasInversionResponse> {
    const params = new HttpParams()
      .set('inicio', inicio)
      .set('fin', fin);
    return this.http.get<EstadisticasInversionResponse>(`${this.apiUrl}/inversion/rango`, { params });
  }
}
