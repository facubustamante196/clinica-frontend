/** Rango horario de un médico, tal como lo devuelve GET /agendas. */
export interface Agenda {
  id: number;
  /** Formato YYYY-MM-DD. */
  fecha: string;
  /** Formato HH:MM. */
  hora_entrada: string;
  /** Formato HH:MM. */
  hora_salida: string;
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
  medico_nombre: string;
  medico_apellido: string;
  especialidad_descripcion: string;
  sede_nombre: string;
}

/** Body de POST /agendas y PUT /agendas/:id. */
export interface AgendaRequest {
  fecha: string;
  hora_entrada: string;
  hora_salida: string;
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
}

export interface FiltrosAgenda {
  id_medico?: number;
  id_sede?: number;
  id_especialidad?: number;
  fecha?: string;
}
