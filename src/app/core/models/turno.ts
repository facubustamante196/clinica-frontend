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
  /** Formato HH:mm (la API puede devolver HH:mm:ss). */
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
  nombre_paciente?: string;
  apellido_paciente?: string;
  /** Formato YYYY-MM-DD. */
  fecha_nacimiento_paciente?: string;
}

/** Body de POST /turnos. El paciente no envía `id_paciente`; el operador sí. */
export interface TurnoRequest {
  id_especialidad: number;
  id_sede: number;
  id_medico: number;
  fecha: string;
  hora: string;
  nota: string;
  id_paciente?: number;
}

/** Datos clínicos que se cargan al marcar un turno como atendido. */
export interface DatosAtencion {
  diagnostico: string;
  tratamiento: string;
  observaciones?: string;
}

export interface FiltrosTurnos {
  fecha: string;
  id_medico?: number;
  id_sede?: number;
}
