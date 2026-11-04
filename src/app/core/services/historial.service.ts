import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, HistorialClinico } from '../models';
import { armarParametros } from '../utils/parametros';

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/historial`;

  /**
   * Historial del usuario logueado: el paciente ve el suyo y el médico, solo el de los
   * turnos que atendió él. Con `idPaciente` el médico filtra por paciente.
   */
  listar(idPaciente?: number): Observable<HistorialClinico[]> {
    return this.http
      .get<ApiRespuesta<HistorialClinico[]>>(this.url, {
        params: armarParametros({ id_paciente: idPaciente }),
      })
      .pipe(map(({ datos }) => datos));
  }
}
