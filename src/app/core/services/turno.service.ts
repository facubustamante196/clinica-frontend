import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, DatosAtencion, FiltrosTurnos, Turno, TurnoRequest } from '../models';
import { armarParametros } from '../utils/parametros';
import { NotificacionService } from './notificacion.service';

@Injectable({ providedIn: 'root' })
export class TurnoService {
  private readonly http = inject(HttpClient);
  private readonly notificaciones = inject(NotificacionService);
  private readonly url = `${environment.apiUrl}/turnos`;

  /** Turnos del paciente logueado. */
  listarMios(): Observable<Turno[]> {
    return this.http
      .get<ApiRespuesta<Turno[]>>(`${this.url}/mios`)
      .pipe(map(({ datos }) => datos));
  }

  /**
   * Turnos de una fecha (médico y operador). El médico recibe solo los suyos, de todas
   * sus sedes; el operador indica `id_medico` o `id_sede`.
   */
  listar(filtros: FiltrosTurnos): Observable<Turno[]> {
    return this.http
      .get<ApiRespuesta<Turno[]>>(this.url, { params: armarParametros(filtros) })
      .pipe(map(({ datos }) => datos));
  }

  /** Solicita un turno (paciente u operador) y refresca el contador de notificaciones. */
  crear(datos: TurnoRequest): Observable<Turno> {
    return this.http.post<ApiRespuesta<Turno>>(this.url, datos).pipe(
      map(({ datos }) => datos),
      tap(() => this.notificaciones.refrescar()),
    );
  }

  /** Cancela un turno confirmado y refresca el contador de notificaciones. */
  cancelar(id: number): Observable<Turno> {
    return this.http.patch<ApiRespuesta<Turno>>(`${this.url}/${id}/cancelar`, {}).pipe(
      map(({ datos }) => datos),
      tap(() => this.notificaciones.refrescar()),
    );
  }

  /**
   * Marca un turno como atendido (médico). Si se envían los datos clínicos, el backend
   * guarda el cambio de estado y el historial en una sola transacción.
   */
  atender(id: number, atencion?: DatosAtencion): Observable<Turno> {
    return this.http.patch<ApiRespuesta<Turno>>(`${this.url}/${id}/atender`, atencion ?? {}).pipe(
      map(({ datos }) => datos),
      tap(() => this.notificaciones.refrescar()),
    );
  }
}
