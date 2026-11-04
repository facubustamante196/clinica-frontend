import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

/** Indicador de carga mientras se espera una respuesta del backend. */
@Component({
  selector: 'app-cargando',
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="cargando" role="status" aria-live="polite">
      <mat-spinner diameter="40" />
      <span>{{ mensaje() }}</span>
    </div>
  `,
  styles: `
    .cargando {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 32px 16px;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class Cargando {
  readonly mensaje = input('Cargando…');
}
