import { HttpErrorResponse } from '@angular/common/http';

import { ApiRespuesta } from '../models';

export const MENSAJE_SIN_CONEXION =
  'No se pudo conectar con el servidor. Verificá tu conexión e intentá de nuevo.';
export const MENSAJE_ERROR_INESPERADO = 'Ocurrió un error inesperado. Intentá de nuevo más tarde.';

/** `true` si el backend no respondió (caído, sin red o bloqueado por CORS). */
export function esErrorDeConexion(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 0;
}

/** `true` si el backend respondió con un error interno (5xx). */
export function esErrorDelServidor(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status >= 500;
}

/**
 * Texto para mostrarle al usuario a partir de un error HTTP: el `mensaje` que
 * manda la API en errores controlados (4xx), o uno genérico si no respondió o falló.
 */
export function mensajeError(error: unknown, porDefecto = MENSAJE_ERROR_INESPERADO): string {
  if (esErrorDeConexion(error)) {
    return MENSAJE_SIN_CONEXION;
  }
  if (!(error instanceof HttpErrorResponse) || esErrorDelServidor(error)) {
    return porDefecto;
  }
  const cuerpo = error.error as Partial<ApiRespuesta<unknown>> | null;
  return cuerpo?.mensaje || porDefecto;
}
