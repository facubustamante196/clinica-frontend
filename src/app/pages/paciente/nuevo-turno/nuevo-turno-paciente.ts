import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

import { NuevoTurno } from '../../../shared/nuevo-turno/nuevo-turno';

@Component({
  selector: 'app-nuevo-turno-paciente',
  imports: [MatCardModule, NuevoTurno],
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Nuevo turno</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <app-nuevo-turno (creado)="avisar()" />
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
      max-width: 860px;
      margin: 16px auto;
    }

    mat-card-content {
      padding-top: 16px;
    }
  `,
})
export class NuevoTurnoPaciente {
  private readonly snackBar = inject(MatSnackBar);

  protected avisar(): void {
    this.snackBar.open('Turno confirmado. Lo ves en "Mis turnos".', 'Cerrar', { duration: 5000 });
  }
}
