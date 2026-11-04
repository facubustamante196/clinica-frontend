/** Registro de historial clínico de un turno atendido (GET /historial). */
export interface HistorialClinico {
  id: number;
  id_turno: number;
  id_paciente?: number;
  id_medico?: number;
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
  fecha_registro: string;
  /** Formato YYYY-MM-DD. */
  fecha_turno?: string;
  hora_turno?: string;
  especialidad_descripcion?: string;
  sede_nombre?: string;
  paciente_nombre?: string;
  paciente_apellido?: string;
  medico_nombre?: string;
  medico_apellido?: string;
}
