import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import type { UserRole } from '../../domain/models/user.model';

/**
 * Fábrica de guards por rol.
 * Uso: canActivate: [roleGuard('admin')]
 *      canActivate: [roleGuard('vecino', 'admin')]
 *
 * Si el usuario no tiene uno de los roles permitidos, redirige a /home.
 */
export function roleGuard(...allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authState = inject(AuthStateService);
    const router = inject(Router);

    const user = authState.currentUser();
    if (user && allowedRoles.includes(user.role)) {
      return true;
    }

    return router.createUrlTree(['/home']);
  };
}
