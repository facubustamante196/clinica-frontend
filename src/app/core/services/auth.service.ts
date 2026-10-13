import { HttpClient, HttpContext, HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { OMITIR_MANEJO_401 } from '../interceptors/omitir-manejo-401';
import {
  ApiRespuesta,
  LoginResponse,
  RegistroRequest,
  RegistroResponse,
  Rol,
  Usuario,
} from '../models';
import { TokenService } from './token.service';

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
  private readonly tokens = inject(TokenService);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly _usuario = signal<Usuario | null>(null);

  /** Usuario actual (datos de /auth/perfil) o null si no hay sesión. */
  readonly usuario = this._usuario.asReadonly();
  readonly rol = computed<Rol | null>(() => this._usuario()?.rol ?? null);
  readonly estaLogueado = computed(() => this._usuario() !== null);

  /**
   * Inicia sesión, guarda el token y carga el perfil completo del usuario.
   * Las credenciales inválidas llegan como error 401 a quien se suscribe.
   */
  login(dni: string, password: string): Observable<Usuario> {
    const context = new HttpContext().set(OMITIR_MANEJO_401, true);
    return this.http
      .post<ApiRespuesta<LoginResponse>>(`${this.url}/login`, { dni, password }, { context })
      .pipe(
        tap(({ datos }) => this.tokens.guardar(datos.token)),
        switchMap(() => this.obtenerPerfil()),
        catchError((error: unknown) => {
          // Si falló el perfil después de guardar el token, no queda una sesión a medias.
          this.limpiarSesion();
          return throwError(() => error);
        }),
      );
  }

  /** Cierra la sesión y navega a `destino` (por defecto, la pantalla principal). */
  logout(destino = '/'): void {
    this.limpiarSesion();
    this.router.navigateByUrl(destino);
  }

  /** Pide GET /auth/perfil y actualiza el usuario actual. */
  obtenerPerfil(): Observable<Usuario> {
    return this.pedirPerfil(new HttpContext());
  }

  /** Registra un paciente. No inicia sesión. */
  registrar(datos: RegistroRequest): Observable<RegistroResponse> {
    return this.http
      .post<ApiRespuesta<RegistroResponse>>(`${this.url}/registro`, datos)
      .pipe(map(({ datos }) => datos));
  }

  /**
   * Recupera la sesión a partir del token guardado. Se ejecuta al iniciar la app,
   * antes de la primera navegación, para que los guards ya conozcan al usuario.
   */
  restaurarSesion(): Observable<unknown> {
    if (!this.tokens.obtener()) {
      return of(null);
    }
    const context = new HttpContext().set(OMITIR_MANEJO_401, true);
    return this.pedirPerfil(context).pipe(
      catchError((error: unknown) => {
        // Token vencido o usuario inexistente: se descarta. Si el backend no
        // responde, se conserva el token para reintentar en la próxima carga.
        if (
          error instanceof HttpErrorResponse &&
          (error.status === HttpStatusCode.Unauthorized || error.status === HttpStatusCode.NotFound)
        ) {
          this.limpiarSesion();
        }
        return of(null);
      }),
    );
  }

  private pedirPerfil(context: HttpContext): Observable<Usuario> {
    return this.http.get<ApiRespuesta<Usuario>>(`${this.url}/perfil`, { context }).pipe(
      map(({ datos }) => datos),
      tap((usuario) => this._usuario.set(usuario)),
    );
  }

  private limpiarSesion(): void {
    this.tokens.borrar();
    this._usuario.set(null);
  }
}
