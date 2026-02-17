import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Protege rutas de invitado (login, register, welcome).
 * Si ya hay sesión activa, redirige a /home.
 */
export const guestGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);

  if (!authState.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/home']);
};
