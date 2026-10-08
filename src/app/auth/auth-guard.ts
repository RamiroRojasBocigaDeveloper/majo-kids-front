import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from './auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.getCurrentUser();

  if (authService.getToken()) {
    // Cuando canActivate esta en la ruta padre, la data de roles vive en la ruta hija
    const expectedRoles = (route.data?.['expectedRoles'] as string[])
      ?? (route.firstChild?.data?.['expectedRoles'] as string[]);

    if (!expectedRoles || expectedRoles.length === 0) {
      return true;
    }

    if (user && expectedRoles.includes(user.rol?.toUpperCase())) {
      return true;
    }

    // Si tiene token pero no el rol, redirigir al inicio
    router.navigate(['/']);
    return false;
  }

  router.navigate(['/login']);
  return false;
};
