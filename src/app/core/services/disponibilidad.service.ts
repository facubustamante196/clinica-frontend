import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta } from '../models';
import { armarParametros } from '../utils/parametros';

export interface ConsultaDisponibilidad {
  id_medico: number;
  id_especialidad: number;
  id_sede: number;
}

@Injectable({ providedIn: 'root' })
export class DisponibilidadService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/disponibilidad`;

  /** Fechas (YYYY-MM-DD) desde hoy con agenda y al menos un horario libre. */
  fechas(consulta: ConsultaDisponibilidad): Observable<string[]> {
    return this.http
      .get<ApiRespuesta<string[]>>(`${this.url}/fechas`, { params: armarParametros(consulta) })
      .pipe(map(({ datos }) => datos));
  }

  /** Horarios libres (HH:MM) de un médico en una fecha. */
  horarios(consulta: ConsultaDisponibilidad, fecha: string): Observable<string[]> {
    return this.http
      .get<ApiRespuesta<string[]>>(`${this.url}/horarios`, {
        params: armarParametros({ ...consulta, fecha }),
      })
      .pipe(map(({ datos }) => datos));
  }
}
