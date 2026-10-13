import { Component, input } from '@angular/core';

import { PaginaEstado } from '../../shared/pagina-estado/pagina-estado';

@Component({
  selector: 'app-en-construccion',
  imports: [PaginaEstado],
  templateUrl: './en-construccion.html',
})
export class EnConstruccion {
  /** Nombre de la función pendiente; llega desde `data.funcion` de la ruta. */
  readonly funcion = input<string>();
}
