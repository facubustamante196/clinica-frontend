import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiRespuesta,
  FiltrosUsuarios,
  Paginado,
  UsuarioAltaRequest,
  UsuarioDetalle,
  UsuarioEdicionRequest,
  UsuarioListado,
} from '../models';

/** Gestión de usuarios (solo administrador). */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/usuarios`;

  /** Página de usuarios filtrada, ordenada por apellido y nombre. */
  listar(
    filtros: FiltrosUsuarios,
    pagina: number,
    limite: number,
  ): Observable<Paginado<UsuarioListado>> {
    let params = new HttpParams().set('pagina', pagina).set('limite', limite);
    for (const [clave, valor] of Object.entries(filtros)) {
      const texto = typeof valor === 'string' ? valor.trim() : valor;
      if (texto !== undefined && texto !== null && texto !== '') {
        params = params.set(clave, String(texto));
      }
    }
    return this.http
      .get<ApiRespuesta<Paginado<UsuarioListado>>>(this.url, { params })
      .pipe(map(({ datos }) => datos));
  }

  obtener(id: number): Observable<UsuarioDetalle> {
    return this.http
      .get<ApiRespuesta<UsuarioDetalle>>(`${this.url}/${id}`)
      .pipe(map(({ datos }) => datos));
  }

  crear(datos: UsuarioAltaRequest): Observable<UsuarioDetalle> {
    return this.http
      .post<ApiRespuesta<UsuarioDetalle>>(this.url, datos)
      .pipe(map(({ datos }) => datos));
  }

  actualizar(id: number, datos: UsuarioEdicionRequest): Observable<UsuarioDetalle> {
    return this.http
      .put<ApiRespuesta<UsuarioDetalle>>(`${this.url}/${id}`, datos)
      .pipe(map(({ datos }) => datos));
  }
}
