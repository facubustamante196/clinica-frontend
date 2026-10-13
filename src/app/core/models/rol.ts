/** Roles tal como los devuelve la API (columna `usuario.rol`). */
export const ROLES = ['admin', 'operador', 'medico', 'paciente'] as const;

export type Rol = (typeof ROLES)[number];

/** Nombre legible de cada rol para mostrar en pantalla. */
export const ETIQUETAS_ROL: Record<Rol, string> = {
  admin: 'Administrador',
  operador: 'Operador',
  medico: 'Médico',
  paciente: 'Paciente',
};
