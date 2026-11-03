/** Notificación del usuario logueado (GET /notificaciones). */
export interface Notificacion {
  id: number;
  id_usuario: number;
  tipo: string;
  mensaje: string;
  /** Fecha y hora de creación (ISO). */
  fecha: string;
  /** La API la devuelve como 0 o 1. */
  leida: number | boolean;
}
