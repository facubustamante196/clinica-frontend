/** Especialidad médica, tal como la devuelve GET /especialidades. */
export interface Especialidad {
  id: number;
  descripcion: string;
}

export type EspecialidadRequest = Omit<Especialidad, 'id'>;
