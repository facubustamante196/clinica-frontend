import { HttpErrorResponse, HttpInterceptorFn, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';
import { OMITIR_MANEJO_401 } from './omitir-manejo-401';

/** Agrega el Bearer a las peticiones hacia la API y cierra la sesión ante un 401. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const token = inject(TokenService).obtener();
  const auth = inject(AuthService);
  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === HttpStatusCode.Unauthorized &&
        !req.context.get(OMITIR_MANEJO_401)
      ) {
        auth.logout('/login');
      }
      return throwError(() => error);
    }),
  );
};
