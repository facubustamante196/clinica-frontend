import { Component, computed, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';

import { ETIQUETAS_ROL } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [MatButtonModule, MatIconModule, MatToolbarModule, MatTooltipModule, RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  protected readonly auth = inject(AuthService);

  /** Pide abrir o cerrar el menú lateral (lo resuelve el contenedor). */
  readonly menuClick = output<void>();

  protected readonly nombreCompleto = computed(() => {
    const usuario = this.auth.usuario();
    return usuario ? `${usuario.nombre} ${usuario.apellido}` : '';
  });

  protected readonly tipoUsuario = computed(() => {
    const rol = this.auth.rol();
    return rol ? `Tipo de usuario: ${ETIQUETAS_ROL[rol]}` : '';
  });

  protected cerrarSesion(): void {
    this.auth.logout();
  }
}
