import { Especialidad } from './especialidad';
import { Rol } from './rol';

/** Respuesta paginada de la API. */
export interface Paginado<T> {
  items: T[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
}

/** Usuario tal como lo devuelve GET /usuarios (solo admin). */
export interface UsuarioListado {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  /** Formato YYYY-MM-DD. */
  fecha_nacimiento: string | null;
  rol: Rol;
  id_sede: number | null;
  sede: string | null;
  id_cobertura: number | null;
  cobertura: string | null;
}

/** Detalle de GET /usuarios/:id. `especialidades` viene vacío si no es médico. */
export interface UsuarioDetalle extends UsuarioListado {
  especialidades: Especialidad[];
}

/** Filtros de GET /usuarios. Los vacíos no se envían. */
export interface FiltrosUsuarios {
  nombre?: string;
  apellido?: string;
  rol?: Rol;
  id_sede?: number;
}

/** Roles que el administrador puede dar de alta (los pacientes se registran solos). */
export const ROLES_ALTA = ['operador', 'medico', 'admin'] as const satisfies readonly Rol[];
export type RolAlta = (typeof ROLES_ALTA)[number];

/** Campos comunes a todos los roles. */
interface DatosUsuarioRequest {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  /** Formato YYYY-MM-DD. */
  fecha_nacimiento: string;
  /** Solo operador y médico. */
  id_sede?: number;
  /** Solo médico: ids de sus especialidades. */
  especialidades?: number[];
}

/** Body de POST /usuarios. */
export interface UsuarioAltaRequest extends DatosUsuarioRequest {
  rol: RolAlta;
  password: string;
}

/** Body de PUT /usuarios/:id. El rol no se modifica. */
export interface UsuarioEdicionRequest extends DatosUsuarioRequest {
  /** Si no viene, la contraseña no cambia. */
  password?: string;
  /** Solo paciente. */
  id_cobertura?: number;
}
