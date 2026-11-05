import { Component, input } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';

/**
 * Barra de progreso para recargas de un listado que ya tiene datos. Siempre ocupa su
 * lugar (4px), así que al aparecer o desaparecer no mueve el contenido de abajo.
 */
@Component({
  selector: 'app-barra-carga',
  imports: [MatProgressBarModule],
  template: `
    <div class="barra" [class.oculta]="!activa()" role="status" [attr.aria-hidden]="!activa()">
      <mat-progress-bar mode="indeterminate" aria-label="Actualizando" />
    </div>
  `,
  styles: `
    .barra {
      height: 4px;
      margin: 4px 0;
    }

    .oculta {
      visibility: hidden;
    }
  `,
})
export class BarraCarga {
  readonly activa = input(false);
}
