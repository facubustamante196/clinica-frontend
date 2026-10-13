import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, Cobertura } from '../models';

@Injectable({ providedIn: 'root' })
export class CoberturaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/coberturas`;

  /** Coberturas activas (endpoint público, se usa en el registro). */
  listar(): Observable<Cobertura[]> {
    return this.http.get<ApiRespuesta<Cobertura[]>>(this.url).pipe(map(({ datos }) => datos));
  }
}
