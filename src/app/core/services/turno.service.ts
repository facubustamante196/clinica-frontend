import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, Turno } from '../models';
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

  /** Cancela un turno confirmado y refresca el contador de notificaciones. */
  cancelar(id: number): Observable<Turno> {
    return this.http.patch<ApiRespuesta<Turno>>(`${this.url}/${id}/cancelar`, {}).pipe(
      map(({ datos }) => datos),
      tap(() => this.notificaciones.refrescar()),
    );
  }
}
