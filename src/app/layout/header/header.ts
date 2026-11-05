import { Component, computed, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, interval } from 'rxjs';

import { ETIQUETAS_ROL } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { mensajeError } from '../../core/utils/mensaje-error';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';

/** Cada cuánto se vuelven a pedir las notificaciones mientras la pestaña está visible. */
const INTERVALO_NOTIFICACIONES_MS = 60_000;

@Component({
  selector: 'app-header',
  imports: [
    FechaPipe,
    MatBadgeModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
    MatToolbarModule,
    MatTooltipModule,
    RouterLink,
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly auth = inject(AuthService);
  protected readonly notificaciones = inject(NotificacionService);
  private readonly snackBar = inject(MatSnackBar);

  /** Pide abrir o cerrar el menú lateral (lo resuelve el contenedor). */
  readonly menuClick = output<void>();

  protected readonly nombreCompleto = computed(() => {
    const usuario = this.auth.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '';
  });

  protected readonly etiquetaRol = computed(() => {
    const rol = this.auth.rol();
    return rol ? ETIQUETAS_ROL[rol] : '';
  });

  constructor() {
    // Las notificaciones se actualizan cada vez que el usuario ingresa o navega.
    inject(Router)
      .events.pipe(
        filter((evento) => evento instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.auth.estaLogueado()) {
          this.notificaciones.refrescar();
        } else {
          this.notificaciones.limpiar();
        }
      });

    // Además de al navegar, se consulta cada tanto para enterarse de turnos nuevos
    // (por ejemplo, uno que asignó un operador) sin tener que recargar.
    interval(INTERVALO_NOTIFICACIONES_MS)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        if (this.auth.estaLogueado() && !document.hidden) {
          this.notificaciones.refrescar();
        }
      });
  }

  protected marcarLeida(id: number): void {
    this.notificaciones.marcarLeida(id).subscribe({
      error: (error: unknown) =>
        this.snackBar.open(mensajeError(error), 'Cerrar', { duration: 6000 }),
    });
  }

  protected cerrarSesion(): void {
    this.auth.logout();
  }
}
