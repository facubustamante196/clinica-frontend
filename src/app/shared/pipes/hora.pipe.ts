import { Pipe, PipeTransform } from '@angular/core';

import { horaCorta } from '../../core/utils/fechas';

/** Muestra una hora de la API (HH:mm:ss) como HH:mm. */
@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return horaCorta(valor);
  }
}
