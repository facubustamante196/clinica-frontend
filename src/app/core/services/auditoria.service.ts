import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, FiltrosAuditoria, RegistroAuditoria } from '../models';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/auditoria`;

  /** Registros de auditoría filtrados, del más reciente al más antiguo. */
  listar(filtros: FiltrosAuditoria = {}): Observable<RegistroAuditoria[]> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return this.http
      .get<ApiRespuesta<RegistroAuditoria[]>>(this.url, { params })
      .pipe(map(({ datos }) => datos));
  }
}
