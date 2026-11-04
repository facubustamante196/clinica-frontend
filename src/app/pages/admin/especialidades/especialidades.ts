import { Component, inject } from '@angular/core';

import { Especialidad } from '../../../core/models';
import { EspecialidadService } from '../../../core/services/especialidad.service';
import { AbmCatalogo } from '../../../shared/abm-catalogo/abm-catalogo';
import { ConfigCatalogo } from '../../../shared/abm-catalogo/abm-catalogo.config';

@Component({
  selector: 'app-especialidades',
  imports: [AbmCatalogo],
  template: `<app-abm-catalogo [config]="config" />`,
})
export class Especialidades {
  private readonly servicio = inject(EspecialidadService);

  protected readonly config: ConfigCatalogo<Especialidad> = {
    titulo: 'Especialidades',
    tituloAlta: 'Nueva especialidad',
    tituloEdicion: 'Editar especialidad',
    campos: [{ nombre: 'descripcion', etiqueta: 'Descripción', maxLength: 30 }],
    describir: (especialidad) => `la especialidad "${especialidad.descripcion}"`,
    listar: () => this.servicio.listar(),
    crear: (datos) => this.servicio.crear(datos),
    modificar: (id, datos) => this.servicio.modificar(id, datos),
    eliminar: (id) => this.servicio.eliminar(id),
  };
}
