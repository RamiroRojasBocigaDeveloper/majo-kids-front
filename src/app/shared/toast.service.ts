import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  private nextId = 1;

  success(message: string, title?: string, duration = 3200): void {
    this.show({ type: 'success', message, title, duration });
  }

  error(message: string, title?: string, duration = 4200): void {
    this.show({ type: 'error', message, title, duration });
  }

  warning(message: string, title?: string, duration = 3600): void {
    this.show({ type: 'warning', message, title, duration });
  }

  info(message: string, title?: string, duration = 3000): void {
    this.show({ type: 'info', message, title, duration });
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  dismissAll(): void {
    this.toasts.set([]);
  }

  private show(toast: Partial<Toast>): void {
    const id = this.nextId++;
    const duration = Math.max(2000, toast.duration ?? 3200);

    this.toasts.update(list => [...list, { id, type: 'info', message: '', ...toast, duration }]);

    setTimeout(() => this.dismiss(id), duration);
  }
}