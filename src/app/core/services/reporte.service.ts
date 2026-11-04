import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiRespuesta,
  RangoFechas,
  RankingMedicos,
  Reportes,
  TasaCancelacion,
  TurnosPorEspecialidad,
  TurnosPorSede,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/reportes`;

  /** Pide los cuatro indicadores para el mismo rango y los devuelve juntos. */
  obtenerTodos(rango: RangoFechas): Observable<Reportes> {
    return forkJoin({
      porEspecialidad: this.pedir<TurnosPorEspecialidad>('turnos-por-especialidad', rango),
      porSede: this.pedir<TurnosPorSede>('turnos-por-sede', rango),
      ranking: this.pedir<RankingMedicos>('ranking-medicos', rango),
      cancelacion: this.pedir<TasaCancelacion>('tasa-cancelacion', rango),
    });
  }

  private pedir<T>(reporte: string, { desde, hasta }: RangoFechas): Observable<T> {
    return this.http
      .get<ApiRespuesta<T>>(`${this.url}/${reporte}`, { params: { desde, hasta } })
      .pipe(map(({ datos }) => datos));
  }
}
