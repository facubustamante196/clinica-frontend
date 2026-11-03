const PATRON_FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** YYYY-MM-DD con la fecha local, sin el corrimiento de zona horaria de toISOString(). */
export function fechaIso(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

/**
 * Convierte lo que manda la API en un Date. Las fechas sin hora (YYYY-MM-DD) se
 * toman como locales: `new Date('2026-11-03')` las interpreta en UTC y en
 * Argentina mostraría el día anterior.
 */
export function parsearFecha(valor: string | Date | null | undefined): Date | null {
  if (!valor) {
    return null;
  }
  if (valor instanceof Date) {
    return valor;
  }
  const soloFecha = PATRON_FECHA_ISO.exec(valor);
  const fecha = soloFecha
    ? new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
    : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** Combina una fecha YYYY-MM-DD y una hora HH:mm[:ss] en un Date local. */
export function fechaHora(fecha: string, hora: string): Date {
  const dia = parsearFecha(fecha) ?? new Date(NaN);
  const [horas, minutos] = hora.split(':').map(Number);
  dia.setHours(horas || 0, minutos || 0, 0, 0);
  return dia;
}

/** Recorta una hora HH:mm:ss a HH:mm. */
export function horaCorta(hora: string | null | undefined): string {
  return hora ? hora.slice(0, 5) : '';
}
