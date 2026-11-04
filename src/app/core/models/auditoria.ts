export const ACCIONES_AUDITORIA = ['ALTA', 'BAJA', 'MODIFICACION'] as const;
export type AccionAuditoria = (typeof ACCIONES_AUDITORIA)[number];

/** Entidades que acepta el filtro `entidad` de GET /auditoria. */
export const ENTIDADES_AUDITORIA = ['usuario', 'cobertura', 'especialidad', 'sede'] as const;
export type EntidadAuditoria = (typeof ENTIDADES_AUDITORIA)[number];

/** Registro de auditoría (GET /auditoria), del más reciente al más antiguo. */
export interface RegistroAuditoria {
  id: number;
  id_usuario: number;
  accion: AccionAuditoria;
  entidad: EntidadAuditoria;
  detalle: string;
  /** Fecha y hora (ISO). */
  fecha: string;
}

/** Filtros de GET /auditoria. `desde` y `hasta` (YYYY-MM-DD) van juntos o no van. */
export interface FiltrosAuditoria {
  id_usuario?: number;
  entidad?: EntidadAuditoria;
  desde?: string;
  hasta?: string;
}
