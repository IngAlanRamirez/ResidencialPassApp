import {
  HttpInterceptorFn,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent,
} from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

/**
 * Interceptor que añade el JWT a las peticiones salientes.
 * Usa clase para garantizar la inyección de AuthStateService.
 */
@Injectable()
export class AuthTokenInterceptor implements HttpInterceptor {
  constructor(private readonly authState: AuthStateService) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const token = this.authState.getToken();
    if (token?.trim()) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }
    return next.handle(req);
  }
}

/** Versión funcional por si se prefiere withInterceptors. */
export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authState = inject(AuthStateService);
  const token = authState.getToken();
  if (token?.trim()) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
