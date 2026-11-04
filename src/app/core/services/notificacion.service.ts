import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiRespuesta, Notificacion } from '../models';

/**
 * Notificaciones del usuario logueado y contador de no leídas.
 *
 * Interfaz acordada con el equipo: después de confirmar, cancelar o atender un
 * turno, llamar a `refrescar()` para que el contador se actualice sin recargar.
 */
@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/notificaciones`;

  private readonly _notificaciones = signal<Notificacion[]>([]);

  /** De la más reciente a la más antigua. */
  readonly notificaciones = this._notificaciones.asReadonly();
  readonly noLeidas = computed(() => this._notificaciones().filter((n) => !n.leida).length);

  /** Vuelve a pedir las notificaciones al backend. */
  refrescar(): void {
    this.http
      .get<ApiRespuesta<Notificacion[]>>(this.url)
      .pipe(map(({ datos }) => datos))
      .subscribe({
        next: (notificaciones) => this._notificaciones.set(notificaciones),
        // Si falla se conserva el último listado; el interceptor ya avisó al usuario.
        error: () => undefined,
      });
  }

  /** Marca una notificación como leída y actualiza el contador al instante. */
  marcarLeida(id: number): Observable<void> {
    return this.http.patch<ApiRespuesta<Notificacion>>(`${this.url}/${id}/leida`, {}).pipe(
      tap(() =>
        this._notificaciones.update((lista) =>
          lista.map((n) => (n.id === id ? { ...n, leida: true } : n)),
        ),
      ),
      map(() => undefined),
    );
  }

  /** Vacía el listado al cerrar sesión. */
  limpiar(): void {
    this._notificaciones.set([]);
  }
}
