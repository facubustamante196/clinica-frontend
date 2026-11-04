import { Component, inject } from '@angular/core';

import { Cobertura } from '../../../core/models';
import { CoberturaService } from '../../../core/services/cobertura.service';
import { AbmCatalogo } from '../../../shared/abm-catalogo/abm-catalogo';
import { ConfigCatalogo } from '../../../shared/abm-catalogo/abm-catalogo.config';

@Component({
  selector: 'app-coberturas',
  imports: [AbmCatalogo],
  template: `<app-abm-catalogo [config]="config" />`,
})
export class Coberturas {
  private readonly servicio = inject(CoberturaService);

  protected readonly config: ConfigCatalogo<Cobertura> = {
    titulo: 'Coberturas',
    tituloAlta: 'Nueva cobertura',
    tituloEdicion: 'Editar cobertura',
    campos: [{ nombre: 'nombre', etiqueta: 'Nombre', maxLength: 30 }],
    describir: (cobertura) => `la cobertura "${cobertura.nombre}"`,
    listar: () => this.servicio.listar(),
    crear: (datos) => this.servicio.crear(datos),
    modificar: (id, datos) => this.servicio.modificar(id, datos),
    eliminar: (id) => this.servicio.eliminar(id),
  };
}
