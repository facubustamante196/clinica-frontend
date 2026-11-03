import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';

export interface DatosConfirmacion {
  titulo: string;
  mensaje: string;
  /** Texto del botón que confirma. Por defecto, "Confirmar". */
  textoConfirmar?: string;
}

/** Diálogo "¿Está seguro…?". Se cierra con `true` solo si el usuario confirma. */
@Component({
  selector: 'app-dialogo-confirmacion',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-content>{{ datos.mensaje }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button type="button" [mat-dialog-close]="true" cdkFocusInitial>
        {{ datos.textoConfirmar ?? 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class DialogoConfirmacion {
  protected readonly datos = inject<DatosConfirmacion>(MAT_DIALOG_DATA);
}

/** Abre el diálogo de confirmación y emite `true` si el usuario confirma. */
export function confirmar(dialog: MatDialog, datos: DatosConfirmacion): Observable<boolean> {
  return dialog
    .open<DialogoConfirmacion, DatosConfirmacion, boolean>(DialogoConfirmacion, {
      data: datos,
      width: '420px',
    })
    .afterClosed()
    .pipe(map((resultado) => resultado === true));
}
