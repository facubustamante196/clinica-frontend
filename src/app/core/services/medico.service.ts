import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, FiltrosMedicos, Medico } from '../models';
import { armarParametros } from '../utils/parametros';

@Injectable({ providedIn: 'root' })
export class MedicoService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/medicos`;

  /**
   * Médicos con sus especialidades. Con `id_sede` devuelve los de esa sede y los que
   * tienen agenda cargada en ella.
   */
  listar(filtros: FiltrosMedicos = {}): Observable<Medico[]> {
    return this.http
      .get<ApiRespuesta<Medico[]>>(this.url, { params: armarParametros(filtros) })
      .pipe(map(({ datos }) => datos));
  }
}
