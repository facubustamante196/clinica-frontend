import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  ApiRespuesta,
  LoginResponse,
  RegistroRequest,
  RegistroResponse,
  Rol,
  Usuario,
} from '../models';

/**
 * Estado de sesión y llamadas a /auth.
 *
 * Interfaz pública acordada con el equipo (no cambiar sin avisar):
 * usuario, rol, estaLogueado, login(), logout(), obtenerPerfil(), registrar().
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly _usuario = signal<Usuario | null>(null);
  private token: string | null = null;

  /** Usuario actual (datos de /auth/perfil) o null si no hay sesión. */
  readonly usuario = this._usuario.asReadonly();
  readonly rol = computed<Rol | null>(() => this._usuario()?.rol ?? null);
  readonly estaLogueado = computed(() => this._usuario() !== null);

  /** Inicia sesión y carga el perfil completo del usuario. */
  login(dni: string, password: string): Observable<Usuario> {
    return this.http
      .post<ApiRespuesta<LoginResponse>>(`${this.url}/login`, { dni, password })
      .pipe(
        tap(({ datos }) => (this.token = datos.token)),
        switchMap(() => this.obtenerPerfil()),
      );
  }

  /** Cierra la sesión y vuelve a la pantalla principal. */
  logout(): void {
    this.token = null;
    this._usuario.set(null);
    this.router.navigateByUrl('/');
  }

  /** Pide GET /auth/perfil y actualiza el usuario actual. */
  obtenerPerfil(): Observable<Usuario> {
    return this.http.get<ApiRespuesta<Usuario>>(`${this.url}/perfil`).pipe(
      map(({ datos }) => datos),
      tap((usuario) => this._usuario.set(usuario)),
    );
  }

  /** Registra un paciente. No inicia sesión. */
  registrar(datos: RegistroRequest): Observable<RegistroResponse> {
    return this.http
      .post<ApiRespuesta<RegistroResponse>>(`${this.url}/registro`, datos)
      .pipe(map(({ datos }) => datos));
  }
}
