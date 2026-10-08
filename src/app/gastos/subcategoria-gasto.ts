import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SubcategoriaGasto {
  id: number;
  nombre: string;
  categoriaGastoId: number;
}

@Injectable({
  providedIn: 'root'
})
export class SubcategoriaGastoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/subcategorias-gastos`;

  obtenerPorCategoria(categoriaId: number): Observable<SubcategoriaGasto[]> {
    return this.http.get<SubcategoriaGasto[]>(`${this.apiUrl}/categoria/${categoriaId}`);
  }
}
