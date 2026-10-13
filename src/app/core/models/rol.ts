/** Roles tal como los devuelve la API (columna `usuario.rol`). */
export const ROLES = ['admin', 'operador', 'medico', 'paciente'] as const;

export type Rol = (typeof ROLES)[number];
