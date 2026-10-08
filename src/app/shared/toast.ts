import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ToastService, ToastType } from './toast.service';

const TYPE_META: Record<ToastType, { icon: string; label: string }> = {
  success: { icon: 'check_circle', label: 'Éxito' },
  error: { icon: 'cancel', label: 'Error' },
  warning: { icon: 'warning', label: 'Aviso' },
  info: { icon: 'info', label: 'Información' }
};

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="toast-viewport">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast toast-{{ toast.type }}" role="status">
          <div class="toast-bar"></div>
          <div class="toast-accents"></div>
          <div class="toast-icon">
            <mat-icon>{{ meta(toast.type).icon }}</mat-icon>
          </div>
          <div class="toast-body">
            <div class="toast-label">{{ meta(toast.type).label }}</div>
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Cerrar">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-viewport {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: min(380px, calc(100vw - 40px));
      pointer-events: none;
    }

    .toast {
      pointer-events: auto;
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 16px 16px 16px 18px;
      border-radius: 18px;
      background: var(--glass-bg);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border: 1px solid var(--border-color);
      box-shadow: 0 18px 40px rgba(0, 0, 0, 0.14);
      overflow: hidden;
      animation: toast-in 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @keyframes toast-in {
      from { opacity: 0; transform: translateX(120%); }
      to { opacity: 1; transform: translateX(0); }
    }

    .toast-bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 5px;
      border-radius: 18px 0 0 18px;
      background: var(--premium-accent);
    }

    .toast-accents {
      position: absolute;
      inset: 0 auto 0 0;
      width: 60px;
      background: radial-gradient(circle at top left, rgba(255, 45, 129, 0.12), transparent 70%);
      pointer-events: none;
    }

    .toast-icon {
      flex-shrink: 0;
      width: 42px;
      height: 42px;
      border-radius: 13px;
      display: grid;
      place-items: center;
      background: var(--soft-gradient);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }
    .toast-icon mat-icon { font-size: 24px; width: 24px; height: 24px; color: var(--primary); }

    .toast-body { display: flex; flex-direction: column; min-width: 0; gap: 2px; }

    .toast-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1.4px;
      color: var(--primary);
    }

    .toast-title {
      font-size: 15px;
      font-weight: 800;
      color: var(--dark-text);
      line-height: 1.25;
    }

    .toast-message {
      font-size: 13px;
      line-height: 1.45;
      color: var(--subtle-text);
    }

    .toast-close {
      flex-shrink: 0;
      margin-left: auto;
      border: none;
      background: transparent;
      color: var(--subtle-text);
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      transition: background 0.2s, color 0.2s;
    }
    .toast-close:hover { background: var(--light-pink); color: var(--primary-pink); }
    .toast-close mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .toast-success {
      --primary: #2e7d32;
      --accent: #43a047;
      border-left-color: #2e7d32;
    }
    .toast-error {
      --primary: #d32f2f;
    }
    .toast-warning {
      --primary: #ef6c00;
    }
    .toast-info {
      --primary: #6a1b9a;
    }

    .toast-success .toast-bar { background: linear-gradient(180deg, #2e7d32, #66bb6a); }
    .toast-error .toast-bar { background: linear-gradient(180deg, #d32f2f, #e57373); }
    .toast-warning .toast-bar { background: linear-gradient(180deg, #ef6c00, #ffb74d); }
    .toast-info .toast-bar { background: linear-gradient(180deg, #6a1b9a, #ab47bc); }

    .toast-success .toast-icon { background: linear-gradient(135deg, #e8f5e9, #c8e6c9); }
    .toast-error .toast-icon { background: linear-gradient(135deg, #ffebee, #ffcdd2); }
    .toast-warning .toast-icon { background: linear-gradient(135deg, #fff3e0, #ffe0b2); }
    .toast-info .toast-icon { background: linear-gradient(135deg, #f3e5f5, #e1bee7); }
  `]
})
export class ToastHost {
  readonly toastService = inject(ToastService);

  meta(type: ToastType) {
    return TYPE_META[type];
  }
}