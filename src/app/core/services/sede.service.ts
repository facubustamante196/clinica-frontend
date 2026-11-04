import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, Sede, SedeRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class SedeService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/sedes`;

  listar(): Observable<Sede[]> {
    return this.http.get<ApiRespuesta<Sede[]>>(this.url).pipe(map(({ datos }) => datos));
  }

  crear(datos: SedeRequest): Observable<Sede> {
    return this.http.post<ApiRespuesta<Sede>>(this.url, datos).pipe(map(({ datos }) => datos));
  }

  modificar(id: number, datos: SedeRequest): Observable<Sede> {
    return this.http
      .put<ApiRespuesta<Sede>>(`${this.url}/${id}`, datos)
      .pipe(map(({ datos }) => datos));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiRespuesta<unknown>>(`${this.url}/${id}`).pipe(map(() => undefined));
  }
}
