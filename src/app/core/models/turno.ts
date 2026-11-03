export const ESTADOS_TURNO = ['confirmado', 'cancelado', 'atendido'] as const;

export type EstadoTurno = (typeof ESTADOS_TURNO)[number];

export const ETIQUETAS_ESTADO_TURNO: Record<EstadoTurno, string> = {
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
  atendido: 'Atendido',
};

/** Turno tal como lo devuelve la API (GET /turnos, GET /turnos/mios). */
export interface Turno {
  id: number;
  /** Formato YYYY-MM-DD. */
  fecha: string;
  /** Formato HH:mm:ss. */
  hora: string;
  nota: string;
  estado: EstadoTurno;
  id_paciente: number;
  id_cobertura: number;
  id_agenda: number;
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
  /** Nombres para mostrar; los agrega el backend para no resolver ids desde el front. */
  nombre_medico?: string;
  apellido_medico?: string;
  especialidad?: string;
  sede?: string;
}
