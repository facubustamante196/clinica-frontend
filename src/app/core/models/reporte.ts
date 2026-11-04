/** Rango de fechas de los reportes, en formato YYYY-MM-DD. */
export interface RangoFechas {
  desde: string;
  hasta: string;
}

export interface TurnosPorEspecialidad extends RangoFechas {
  items: { id_especialidad: number; descripcion: string; cantidad: number }[];
}

export interface TurnosPorSede extends RangoFechas {
  items: { id_sede: number; nombre: string; cantidad: number }[];
}

export interface RankingMedicos extends RangoFechas {
  items: { id_medico: number; nombre: string; apellido: string; cantidad: number; posicion: number }[];
}

export interface TasaCancelacion extends RangoFechas {
  total: number;
  cancelados: number;
  /** Porcentaje con dos decimales (ej: 12.5). */
  tasa_cancelacion: number;
}

/** Los cuatro indicadores del dashboard para un mismo rango. */
export interface Reportes {
  porEspecialidad: TurnosPorEspecialidad;
  porSede: TurnosPorSede;
  ranking: RankingMedicos;
  cancelacion: TasaCancelacion;
}
