import { Rol } from './rol';

export interface LoginRequest {
  dni: string;
  password: string;
}

/** Payload del JWT; es también el `usuario` que devuelve POST /auth/login. */
export interface UsuarioToken {
  id: number;
  rol: Rol;
  id_sede: number | null;
}

export interface LoginResponse {
  token: string;
  usuario: UsuarioToken;
}

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  password: string;
  /** Formato YYYY-MM-DD. */
  fecha_nacimiento: string;
  id_cobertura: number;
  telefono?: string;
}

/**
 * Body de PATCH /auth/perfil (solo paciente). Se envían solo los campos que
 * cambian; tiene que venir al menos uno.
 */
export interface ActualizarPerfilRequest {
  email?: string;
  password?: string;
  telefono?: string;
  id_cobertura?: number;
}

export interface RegistroResponse {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  rol: Rol;
}
