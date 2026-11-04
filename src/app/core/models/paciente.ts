/** Paciente encontrado por GET /pacientes (solo los datos necesarios para elegirlo). */
export interface PacienteBusqueda {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  /** Formato YYYY-MM-DD. */
  fecha_nacimiento: string;
  id_cobertura: number | null;
  cobertura_nombre: string | null;
}

export interface FiltrosPacientes {
  dni?: string;
  apellido?: string;
}
