/** Sede activa, tal como la devuelve GET /sedes. */
export interface Sede {
  id: number;
  nombre: string;
  direccion: string;
  telefono: string;
}

export type SedeRequest = Omit<Sede, 'id'>;
