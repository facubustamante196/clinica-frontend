import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, Cobertura, CoberturaRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class CoberturaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/coberturas`;

  /** Coberturas activas (endpoint público, se usa en el registro). */
  listar(): Observable<Cobertura[]> {
    return this.http.get<ApiRespuesta<Cobertura[]>>(this.url).pipe(map(({ datos }) => datos));
  }

  crear(datos: CoberturaRequest): Observable<Cobertura> {
    return this.http
      .post<ApiRespuesta<Cobertura>>(this.url, datos)
      .pipe(map(({ datos }) => datos));
  }

  modificar(id: number, datos: CoberturaRequest): Observable<Cobertura> {
    return this.http
      .put<ApiRespuesta<Cobertura>>(`${this.url}/${id}`, datos)
      .pipe(map(({ datos }) => datos));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiRespuesta<unknown>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
