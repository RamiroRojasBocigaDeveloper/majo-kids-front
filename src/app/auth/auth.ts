import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaces que coinciden con los DTOs del backend
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  nombre: string;
  rol: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      this.currentUserSubject.next(user);
      // Refrescar el perfil al iniciar la app para asegurar que el rol es correcto
      this.refreshProfile(user.id);
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: AuthResponse) => {
        if (response && response.token) {
          sessionStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }
      })
    );
  }

  logout() {
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  /**
   * Refresca los datos del usuario desde el servidor (especialmente el rol)
   */
  refreshProfile(userId: number) {
    this.http.get<any>(`${environment.apiUrl}/usuarios/${userId}`).subscribe({
      next: (user) => {
        const current = this.getCurrentUser();
        if (current) {
          const updated = { ...current, rol: user.rolNombre, nombre: user.nombre };
          sessionStorage.setItem('currentUser', JSON.stringify(updated));
          this.currentUserSubject.next(updated);
        }
      },
      error: (err) => {
        if (err.status === 401 || err.status === 403) {
          this.logout();
        }
      }
    });
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    const user = this.getCurrentUser();
    return user ? user.token : null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return !!user && user.rol?.toUpperCase() === 'ADMINISTRADOR';
  }

  isVendedor(): boolean {
    const user = this.getCurrentUser();
    return !!user && user.rol?.toUpperCase() === 'VENDEDOR';
  }

  isJefe(): boolean {
    const user = this.getCurrentUser();
    return !!user && user.rol?.toUpperCase() === 'JEFE';
  }

  isAdminOrSuperior(): boolean {
    // En este sistema, ADMINISTRADOR es el nivel más alto.
    return this.isAdmin();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
