import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { esErrorDeConexion, esErrorDelServidor, mensajeError } from '../utils/mensaje-error';

/**
 * Avisa con un snackbar cuando el backend no responde o falla (5xx). El error se
 * vuelve a lanzar para que cada pantalla salga de su estado de carga. Los errores
 * controlados (4xx) los muestra cada pantalla con el mensaje del backend.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (esErrorDeConexion(error) || esErrorDelServidor(error)) {
        snackBar.open(mensajeError(error), 'Cerrar', { duration: 6000 });
      }
      return throwError(() => error);
    }),
  );
};
