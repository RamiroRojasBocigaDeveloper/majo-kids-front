import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-success-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="realm">
      <div class="realm-glow"></div>
      <div class="realm-icon">{{ data.icon || '✨' }}</div>
      <h2 class="realm-title" [style.color]="data.titleColor || 'var(--primary-pink)'">{{ data.title || '¡Operación Exitosa!' }}</h2>
      <p class="realm-message">{{ data.message }}</p>

      <div class="realm-actions">
        <button mat-flat-button class="realm-btn" (click)="dialogRef.close(true)">
          <mat-icon>{{ data.btnIcon || 'check_circle' }}</mat-icon> {{ data.btnText || 'Continuar' }}
        </button>
        <button mat-button class="realm-cancel" *ngIf="data.showCancel" (click)="dialogRef.close(false)">
          Cancelar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .realm {
      position: relative;
      padding: 36px 34px 30px;
      text-align: center;
      border-radius: 24px;
      background: linear-gradient(150deg, #ffffff 0%, #fff7fa 100%);
      overflow: hidden;
      animation: realm-in 0.45s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .realm-glow {
      position: absolute;
      top: -70px;
      left: 50%;
      width: 260px;
      height: 200px;
      transform: translateX(-50%);
      background: radial-gradient(circle, rgba(216, 27, 96, 0.16) 0%, transparent 70%);
      pointer-events: none;
    }
    .realm-icon {
      position: relative;
      width: 84px;
      height: 84px;
      margin: 0 auto 18px;
      display: grid;
      place-items: center;
      font-size: 3.4rem;
      line-height: 1;
      border-radius: 26px;
      background: linear-gradient(145deg, #fff, #ffe3ee);
      box-shadow: 0 12px 30px rgba(216, 27, 96, 0.22), inset 0 1px 0 rgba(255,255,255,0.9);
      animation: icon-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .realm-title {
      margin: 0 0 10px;
      font-size: 1.7rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--primary-pink);
    }
    .realm-message {
      margin: 0 auto 30px;
      max-width: 320px;
      font-size: 1.05rem;
      line-height: 1.55;
      color: #555;
    }
    .realm-actions { position: relative; display: flex; flex-direction: column; gap: 10px; }
    .realm-btn {
      width: 100%;
      padding: 18px 22px;
      font-size: 1.05rem;
      font-weight: 800;
      letter-spacing: 0.3px;
      border-radius: 14px;
      background: var(--vibrant-gradient) !important;
      color: #fff !important;
      box-shadow: 0 10px 26px rgba(216, 27, 96, 0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .realm-btn:hover { transform: translateY(-2px); box-shadow: 0 14px 30px rgba(216, 27, 96, 0.45); }
    .realm-btn mat-icon { margin-right: 6px; }
    .realm-cancel { color: #999; letter-spacing: 0.3px; width: 100%; }

    @keyframes realm-in {
      from { opacity: 0; transform: translateY(18px) scale(0.96); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes icon-pop {
      0% { transform: scale(0.6); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }
  `]
})
export class SuccessDialog {
  dialogRef = inject(MatDialogRef<SuccessDialog>);
  data = inject(MAT_DIALOG_DATA);
}
