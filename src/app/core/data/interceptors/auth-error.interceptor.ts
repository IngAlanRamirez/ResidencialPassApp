import { inject, Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';
import { ToastService } from '../services/toast.service';

/**
 * Intercepta errores 401 (token inválido/expirado) y 403 (sin permisos).
 * Limpia la sesión y redirige al login.
 */
@Injectable()
export class AuthErrorInterceptor implements HttpInterceptor {
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        if (this.authState.isLoggedIn() && (error.status === 401 || error.status === 403)) {
          this.authState.logout();
          this.toast.error(
            error.status === 401
              ? 'Tu sesión ha expirado. Inicia sesión de nuevo.'
              : 'No tienes permisos para esta acción. Inicia sesión de nuevo.'
          );
          this.router.navigate(['/auth/login'], { replaceUrl: true });
        }
        return throwError(() => error);
      })
    );
  }
}
