import { Component, inject } from '@angular/core';

import { Sede } from '../../../core/models';
import { SedeService } from '../../../core/services/sede.service';
import { AbmCatalogo } from '../../../shared/abm-catalogo/abm-catalogo';
import { ConfigCatalogo } from '../../../shared/abm-catalogo/abm-catalogo.config';

@Component({
  selector: 'app-sedes',
  imports: [AbmCatalogo],
  template: `<app-abm-catalogo [config]="config" />`,
})
export class Sedes {
  private readonly servicio = inject(SedeService);

  protected readonly config: ConfigCatalogo<Sede> = {
    titulo: 'Sedes',
    tituloAlta: 'Nueva sede',
    tituloEdicion: 'Editar sede',
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', maxLength: 50 },
      { nombre: 'direccion', etiqueta: 'Dirección', maxLength: 100 },
      {
        nombre: 'telefono',
        etiqueta: 'Teléfono',
        maxLength: 15,
        patron: /^[0-9 +()-]+$/,
        mensajePatron: 'Usá solo números, espacios y los signos + ( ) -.',
      },
    ],
    describir: (sede) => `la sede "${sede.nombre}"`,
    listar: () => this.servicio.listar(),
    crear: (datos) => this.servicio.crear(datos),
    modificar: (id, datos) => this.servicio.modificar(id, datos),
    eliminar: (id) => this.servicio.eliminar(id),
  };
}
