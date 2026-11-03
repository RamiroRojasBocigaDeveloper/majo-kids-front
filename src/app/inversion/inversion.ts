import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReporteService, EstadisticasInversionResponse, InversionProducto } from '../reportes/reporte';
import { ToastService } from '../shared/toast.service';

interface GastoSubcategoria {
  categoria: string;
  monto: number;
  pct: number;
}

@Component({
  selector: 'app-inversion',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule],
  templateUrl: './inversion.html',
  styleUrl: './inversion.css',
})
export class Inversion implements OnInit {
  private reporteService = inject(ReporteService);
  private toast = inject(ToastService);

  data = signal<EstadisticasInversionResponse | null>(null);
  loading = signal(false);
  showCompras = signal(false);
  showGastos = signal(false);

  compras = computed<InversionProducto[]>(() =>
    [...(this.data()?.comprasPorProducto ?? [])].sort((a, b) => b.monto - a.monto)
  );

  gastos = computed<GastoSubcategoria[]>(() => {
    const list = Object.entries(this.data()?.gastosOperativosPorSubcategoria ?? {}).map(
      ([categoria, monto]) => ({ categoria, monto })
    );
    const max = Math.max(...list.map((g) => g.monto), 1);
    return list
      .map((g) => ({ ...g, pct: (g.monto / max) * 100 }))
      .sort((a, b) => b.monto - a.monto);
  });

  ngOnInit() {
    this.cargar();
  }

  cargar() {
    this.loading.set(true);
    this.reporteService.obtenerInversionGlobal().subscribe({
      next: (res) => {
        this.data.set(res);
        this.loading.set(false);
      },
      error: (err) => this.manejarError(err),
    });
  }

  private manejarError(err: any) {
    this.loading.set(false);
    let msg = 'No se pudieron cargar las estadísticas de inversión';
    if (err.status === 403) {
      msg = 'No tienes permisos para ver esta información (se requiere rol Administrador)';
    } else if (err.status === 500) {
      msg = 'Error interno del servidor al calcular la inversión';
    } else if (err.status === 0) {
      msg = 'No se pudo conectar con el servidor. ¿Está el backend encendido?';
    }
    console.error('Error en inversión:', err);
    this.toast.error(msg, 'Error');
  }
}
