import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, Especialidad, EspecialidadRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class EspecialidadService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/especialidades`;

  listar(): Observable<Especialidad[]> {
    return this.http.get<ApiRespuesta<Especialidad[]>>(this.url).pipe(map(({ datos }) => datos));
  }

  crear(datos: EspecialidadRequest): Observable<Especialidad> {
    return this.http
      .post<ApiRespuesta<Especialidad>>(this.url, datos)
      .pipe(map(({ datos }) => datos));
  }

  modificar(id: number, datos: EspecialidadRequest): Observable<Especialidad> {
    return this.http
      .put<ApiRespuesta<Especialidad>>(`${this.url}/${id}`, datos)
      .pipe(map(({ datos }) => datos));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiRespuesta<unknown>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
