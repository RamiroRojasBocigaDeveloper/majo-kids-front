import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth/auth';
import { SuccessDialog } from '../shared/success-dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule, MatDialogModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  @ViewChild('scene') private scene?: ElementRef<HTMLElement>;
  @ViewChild('card') private card?: ElementRef<HTMLElement>;
  @ViewChild('submitBtn') private submitBtn?: ElementRef<HTMLButtonElement>;

  loginForm: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);
  capsLock = signal(false);
  errorMessage = signal<string | null>(null);
  submitted = signal(false);
  shake = signal(false);
  logoWiggle = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit() {
    if (this.loading()) return;

    this.submitted.set(true);
    this.loginForm.markAllAsTouched();
    if (this.loginForm.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: (response) => {
        this.loading.set(false);
        this.dialog.open(SuccessDialog, {
          width: '420px',
          data: {
            icon: '👋',
            title: '¡Hola, ' + response.nombre + '!',
            message: 'Has iniciado sesión correctamente. Bienvenido de nuevo.',
          },
        });
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(this.mensajeError(err));
        this.triggerShake();
      },
    });
  }

  togglePassword() {
    this.hidePassword.update((hidden) => !hidden);
  }

  onPasswordKey(event: KeyboardEvent) {
    this.capsLock.set(event.getModifierState?.('CapsLock') ?? false);
  }

  clearError() {
    if (this.errorMessage()) this.errorMessage.set(null);
  }

  showError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && control.invalid && (control.touched || this.submitted());
  }

  onLogoClick() {
    if (this.prefersReducedMotion()) return;
    this.logoWiggle.set(true);
    window.setTimeout(() => this.logoWiggle.set(false), 700);
  }

  onSceneMove(event: MouseEvent) {
    const scene = this.scene?.nativeElement;
    if (!scene || this.prefersReducedMotion()) return;

    const rect = scene.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;

    scene.style.setProperty('--px', `${(px * 26).toFixed(2)}px`);
    scene.style.setProperty('--py', `${(py * 26).toFixed(2)}px`);
  }

  onCardMove(event: MouseEvent) {
    const card = this.card?.nativeElement;
    if (!card || this.prefersReducedMotion()) return;

    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }

  onButtonMove(event: MouseEvent) {
    const button = this.submitBtn?.nativeElement;
    if (!button || this.prefersReducedMotion()) return;

    const rect = button.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.16;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.28;

    button.style.setProperty('--bx', `${x.toFixed(2)}px`);
    button.style.setProperty('--by', `${y.toFixed(2)}px`);
  }

  onButtonLeave() {
    const button = this.submitBtn?.nativeElement;
    if (!button) return;
    button.style.setProperty('--bx', '0px');
    button.style.setProperty('--by', '0px');
  }

  private triggerShake() {
    this.shake.set(false);
    window.setTimeout(() => {
      this.shake.set(true);
      window.setTimeout(() => this.shake.set(false), 550);
    }, 0);
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private mensajeError(err: any): string {
    switch (err?.status) {
      case 0:
        return 'No se pudo conectar con el servidor. Verifica tu conexión e inténtalo de nuevo.';
      case 401:
        return 'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.';
      case 429:
        return err?.error?.message || 'Demasiados intentos fallidos. Espera unos minutos y vuelve a intentarlo.';
      case 500:
        return 'Error interno del servidor. Inténtalo más tarde.';
      case 502:
      case 503:
      case 504:
        return 'El servidor no está disponible en este momento (puede estar iniciando). Espera unos segundos y vuelve a intentarlo.';
      default:
        return 'No se pudo iniciar sesión. Inténtalo de nuevo en unos minutos.';
    }
  }
}
