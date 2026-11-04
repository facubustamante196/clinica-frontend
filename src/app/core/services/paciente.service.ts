import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, FiltrosPacientes, PacienteBusqueda } from '../models';
import { armarParametros } from '../utils/parametros';

@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/pacientes`;

  /** Busca pacientes por DNI o apellido (por prefijo). Hay que indicar al menos un filtro. */
  buscar(filtros: FiltrosPacientes): Observable<PacienteBusqueda[]> {
    return this.http
      .get<ApiRespuesta<PacienteBusqueda[]>>(this.url, { params: armarParametros(filtros) })
      .pipe(map(({ datos }) => datos));
  }
}
