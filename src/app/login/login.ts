import { Component, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../auth/auth';
import { SuccessDialog } from '../shared/success-dialog';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  loginForm: FormGroup;
  loading = false;
  hide = true;
  errorMessage = signal<string | null>(null);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage.set(null);
      this.cdr.detectChanges();

      this.authService.login(this.loginForm.value).subscribe({
        next: (response) => {
          this.loading = false;
          this.dialog.open(SuccessDialog, {
            width: '420px',
            data: { 
              icon: '👋',
              title: '¡Hola, ' + response.nombre + '!', 
              message: 'Has iniciado sesión correctamente. Bienvenido de nuevo.' 
            }
          });
          this.router.navigate(['/']);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage.set(this.mensajeError(err));
          this.cdr.detectChanges(); // Asegurar que el Signal actualice la vista
        }
      });
    }
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
