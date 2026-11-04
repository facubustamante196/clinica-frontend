import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Mensaje que reemplaza a una tabla o listado vacío. */
@Component({
  selector: 'app-sin-resultados',
  imports: [MatIconModule],
  template: `
    <div class="sin-resultados">
      <mat-icon>{{ icono() }}</mat-icon>
      <span>{{ mensaje() }}</span>
    </div>
  `,
  styles: `
    .sin-resultados {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px 16px;
      color: var(--mat-sys-on-surface-variant);
      text-align: center;
    }

    mat-icon {
      width: 40px;
      height: 40px;
      font-size: 40px;
    }
  `,
})
export class SinResultados {
  readonly mensaje = input('No hay resultados para mostrar.');
  readonly icono = input('search_off');
}
