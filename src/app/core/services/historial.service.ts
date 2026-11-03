import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, HistorialClinico } from '../models';

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/historial`;

  /** Historial del usuario logueado: el paciente ve el suyo y el médico, el que cargó él. */
  listar(): Observable<HistorialClinico[]> {
    return this.http
      .get<ApiRespuesta<HistorialClinico[]>>(this.url)
      .pipe(map(({ datos }) => datos));
  }
}
