import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Gasto {
  id?: number;
  descripcion: string;
  monto: number;
  createdAt: string; 
  fechaRegistroManual?: string;
  categoriaGastoNombre?: string;
  subcategoriaGastoNombre?: string;
  nombreUsuario?: string;
  sesionId?: number;
}

export interface GastoRequest {
  categoriaGastoId: number;
  subcategoriaGastoId?: number;
  descripcion: string;
  monto: number;
  sesionId: number;
  fechaHistorica?: string;
  usuarioId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GastoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/gastos`;

  obtenerTodos(): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(this.apiUrl);
  }

  obtenerPorSesion(sesionId: number): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(`${this.apiUrl}/sesion/${sesionId}`);
  }

  crear(request: GastoRequest): Observable<Gasto> {
    return this.http.post<Gasto>(this.apiUrl, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
