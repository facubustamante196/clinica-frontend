import { Rol } from './rol';

/** Usuario autenticado, tal como lo devuelve GET /auth/perfil. */
export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string | null;
  rol: Rol;
  id_sede: number | null;
  id_cobertura: number | null;
}
