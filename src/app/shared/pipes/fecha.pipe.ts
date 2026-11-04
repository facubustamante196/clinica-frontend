import { formatDate } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

import { parsearFecha } from '../../core/utils/fechas';

/**
 * Muestra una fecha de la API en formato dd/mm/aaaa (o dd/mm/aaaa HH:mm con `conHora`).
 * A diferencia del pipe `date`, no corre un día las fechas YYYY-MM-DD.
 */
@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(valor: string | Date | null | undefined, conHora = false): string {
    const fecha = parsearFecha(valor);
    if (!fecha) {
      return '';
    }
    return formatDate(fecha, conHora ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy', this.locale);
  }
}
