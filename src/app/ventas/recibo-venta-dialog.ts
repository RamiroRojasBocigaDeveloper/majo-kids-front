import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface ReciboVentaData {
  venta: any;
  efectivoRecibido?: number | null;
}

@Component({
  selector: 'app-recibo-venta-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, CurrencyPipe],
  template: `
    <div class="recibo-page">
      <div class="ticket" #ticket>
        <div class="ticket-header">
          <div class="logo">MajoKids</div>
          <div class="recibo-label">RECIBO DE VENTA</div>
        </div>

        <div class="meta">
          <div class="meta-row"><span>Factura</span><strong>{{ venta.numeroFactura }}</strong></div>
          <div class="meta-row"><span>Fecha</span><span>{{ fechaTexto() }}</span></div>
          <div class="meta-row" *ngIf="venta.nombreVendedor"><span>Vendedor</span><span>{{ venta.nombreVendedor }}</span></div>
          <div class="meta-row"><span>Pago</span><span>{{ venta.metodoPagoNombre || '—' }}</span></div>
        </div>

        <div class="divider"></div>

        <table class="items">
          <thead>
            <tr>
              <th class="col-cant">Cant.</th>
              <th class="col-prod">Producto</th>
              <th class="col-imp">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of items()">
              <td class="col-cant">{{ d.cantidad }}</td>
              <td class="col-prod">
                <div class="prod-name">{{ d.productoNombre }}</div>
                <div class="prod-ref" *ngIf="d.productoReferencia">Ref: {{ d.productoReferencia }}</div>
                <div class="prod-unit">{{ d.cantidad }} × {{ d.precioUnitario | currency:'COP':'symbol':'1.0-0' }}</div>
              </td>
              <td class="col-imp">{{ subtotalItem(d) | currency:'COP':'symbol':'1.0-0' }}</td>
            </tr>
          </tbody>
        </table>

        <div class="divider"></div>

        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span>{{ subtotal() | currency:'COP':'symbol':'1.0-0' }}</span></div>
          <div class="total-row" *ngIf="descuento() > 0">
            <span>Descuento</span><span>-{{ descuento() | currency:'COP':'symbol':'1.0-0' }}</span>
          </div>
          <div class="total-row grand"><span>TOTAL</span><span>{{ total() | currency:'COP':'symbol':'1.0-0' }}</span></div>
          <div class="total-row" *ngIf="efectivoRecibido">
            <span>Efectivo recibido</span><span>{{ efectivoRecibido | currency:'COP':'symbol':'1.0-0' }}</span>
          </div>
          <div class="total-row" *ngIf="efectivoRecibido">
            <span>Cambio</span><span>{{ cambio() | currency:'COP':'symbol':'1.0-0' }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="footer">
          <div class="gracias">¡Gracias por su compra!</div>
          <div class="marca">MajoKids</div>
        </div>
      </div>

      <div class="generando" *ngIf="generando">
        <mat-icon>hourglass_top</mat-icon> Generando archivo...
      </div>

      <div class="actions">
        <button mat-flat-button class="btn-pdf" (click)="descargarPdf()" [disabled]="generando">
          <mat-icon>picture_as_pdf</mat-icon> PDF
        </button>
        <button mat-stroked-button class="btn-img" (click)="descargarImagen()" [disabled]="generando">
          <mat-icon>image</mat-icon> Imagen
        </button>
        <button mat-button class="btn-close" (click)="dialogRef.close()">Nueva venta</button>
      </div>
    </div>
  `,
  styles: [`
    .recibo-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 20px 16px 16px;
      background: #fffafc;
    }

    .ticket {
      width: 320px;
      background: #ffffff;
      color: #1a1a1a;
      font-family: 'Roboto', Arial, sans-serif;
      padding: 22px 20px 18px;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(216, 27, 96, 0.15);
      border: 1px dashed #f3c6d8;
    }

    .ticket-header {
      text-align: center;
      margin-bottom: 12px;
    }

    .logo {
      font-size: 1.7rem;
      font-weight: 800;
      color: #d81b60;
      letter-spacing: -0.5px;
    }

    .recibo-label {
      margin-top: 2px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 2px;
      color: #ad1457;
    }

    .meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.82rem;
      color: #444;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
    }

    .meta-row span:first-child { color: #888; }
    .meta-row strong { color: #1a1a1a; font-weight: 700; word-break: break-all; text-align: right; }

    .divider {
      border-top: 1px dashed #e0a8c0;
      margin: 12px 0;
    }

    .items {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.82rem;
    }

    .items thead th {
      text-align: left;
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 1px;
      color: #ad1457;
      padding-bottom: 6px;
      border-bottom: 1px solid #f3dbe7;
    }

    .items tbody td {
      padding: 7px 0 0;
      vertical-align: top;
      color: #1a1a1a;
    }

    .col-cant { width: 38px; text-align: center; font-weight: 700; }
    .col-imp { text-align: right; font-weight: 600; white-space: nowrap; }
    .col-prod { padding-left: 4px !important; }

    .prod-name { font-weight: 600; line-height: 1.25; }
    .prod-ref { font-size: 0.72rem; color: #888; margin-top: 1px; }
    .prod-unit { font-size: 0.74rem; color: #666; margin-top: 2px; }

    .totals {
      display: flex;
      flex-direction: column;
      gap: 5px;
      font-size: 0.86rem;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      color: #333;
    }

    .total-row.grand {
      margin-top: 4px;
      padding-top: 7px;
      border-top: 2px solid #d81b60;
      font-size: 1.15rem;
      font-weight: 800;
      color: #d81b60;
    }

    .footer {
      text-align: center;
      margin-top: 4px;
    }

    .gracias { font-size: 0.85rem; font-weight: 600; color: #333; }
    .marca { font-size: 0.72rem; color: #ad1457; font-weight: 700; margin-top: 2px; letter-spacing: 1px; }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      width: 320px;
    }

    .actions button { width: 100%; font-weight: 700; }
    .btn-pdf {
      background: #d81b60 !important;
      color: #fff !important;
      box-shadow: 0 6px 16px rgba(216, 27, 96, 0.3);
    }
    .btn-img { border-color: #d81b60; color: #d81b60; }
    .btn-close { color: #777; }

    .generando {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.85rem;
      color: #ad1457;
      font-weight: 600;
    }
    .generando mat-icon { font-size: 18px; width: 18px; height: 18px; }
  `]
})
export class ReciboVentaDialog {
  dialogRef = inject(MatDialogRef<ReciboVentaDialog>);
  data: ReciboVentaData = inject(MAT_DIALOG_DATA);

  venta = this.data.venta;
  efectivoRecibido = this.data.efectivoRecibido || null;

  generando = false;

  @ViewChild('ticket') ticketEl!: ElementRef<HTMLDivElement>;

  items(): any[] {
    return this.venta?.detalles || [];
  }

  subtotalItem(d: any): number {
    return (d.cantidad || 0) * (d.precioUnitario || 0);
  }

  subtotal(): number {
    if (this.venta?.subtotal != null) return this.venta.subtotal;
    return this.items().reduce((acc, d) => acc + this.subtotalItem(d), 0);
  }

  descuento(): number {
    return this.venta?.descuento || 0;
  }

  total(): number {
    if (this.venta?.total != null) return this.venta.total;
    return this.subtotal() - this.descuento();
  }

  cambio(): number {
    return Math.max((this.efectivoRecibido || 0) - this.total(), 0);
  }

  fechaTexto(): string {
    const raw = this.venta?.fechaRegistroManual || this.venta?.createdAt;
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return String(raw);
    const fecha = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${fecha} ${hora}`;
  }

  private async capturar(): Promise<HTMLCanvasElement> {
    return html2canvas(this.ticketEl.nativeElement, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true
    });
  }

  private nombreArchivo(ext: string): string {
    const num = this.venta?.numeroFactura || 'recibo';
    return `${num}.${ext}`;
  }

  async descargarPdf() {
    this.generando = true;
    try {
      const canvas = await this.capturar();
      const imgData = canvas.toDataURL('image/png');
      const anchoMm = 80;
      const altoMm = (canvas.height * anchoMm) / canvas.width;
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [anchoMm, altoMm] });
      pdf.addImage(imgData, 'PNG', 0, 0, anchoMm, altoMm);
      pdf.save(this.nombreArchivo('pdf'));
    } catch (e) {
      console.error('Error al generar PDF del recibo', e);
    } finally {
      this.generando = false;
    }
  }

  async descargarImagen() {
    this.generando = true;
    try {
      const canvas = await this.capturar();
      const link = document.createElement('a');
      link.download = this.nombreArchivo('png');
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Error al generar imagen del recibo', e);
    } finally {
      this.generando = false;
    }
  }
}
