/** Formato uniforme con el que responde toda la API. */
export interface ApiRespuesta<T> {
  codigo: number;
  estado: 'ok' | 'error';
  mensaje: string | null;
  datos: T;
}
