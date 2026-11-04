import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Agenda, AgendaRequest, ApiRespuesta, FiltrosAgenda } from '../models';
import { armarParametros } from '../utils/parametros';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/agendas`;

  /** El médico solo recibe su propia agenda; el operador, la de cualquier sede. */
  listar(filtros: FiltrosAgenda = {}): Observable<Agenda[]> {
    return this.http
      .get<ApiRespuesta<Agenda[]>>(this.url, { params: armarParametros(filtros) })
      .pipe(map(({ datos }) => datos));
  }

  crear(datos: AgendaRequest): Observable<void> {
    return this.http.post<ApiRespuesta<unknown>>(this.url, datos).pipe(map(() => undefined));
  }

  modificar(id: number, datos: AgendaRequest): Observable<void> {
    return this.http
      .put<ApiRespuesta<unknown>>(`${this.url}/${id}`, datos)
      .pipe(map(() => undefined));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiRespuesta<unknown>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
