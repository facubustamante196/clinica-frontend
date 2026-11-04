import { Especialidad } from './especialidad';

/** Médico con sus especialidades, tal como lo devuelve GET /medicos (sin datos personales). */
export interface Medico {
  id: number;
  nombre: string;
  apellido: string;
  especialidades: Especialidad[];
}

export interface FiltrosMedicos {
  id_especialidad?: number;
  id_sede?: number;
}
