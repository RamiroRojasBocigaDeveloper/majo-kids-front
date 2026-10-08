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
          
          let message = 'Credenciales incorrectas. Por favor, verifica tu correo y contraseña.';
          if (err.status === 0) message = 'No se pudo conectar con el servidor. Verifica tu conexión.';
          if (err.status === 500) message = 'Error interno del servidor. Inténtalo más tarde.';
          
          this.errorMessage.set(message);
          
          this.cdr.detectChanges(); // Asegurar que el Signal actualice la vista
        }
      });
    }
  }
}
