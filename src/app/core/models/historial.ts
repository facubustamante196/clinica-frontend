/** Registro de historial clínico de un turno atendido (GET /historial). */
export interface HistorialClinico {
  id: number;
  id_turno: number;
  diagnostico: string;
  tratamiento: string;
  observaciones: string;
  fecha_registro: string;
}
