import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';

import { RegistroResponse } from '../../../core/models';
import { FormPaciente } from '../../../shared/form-paciente/form-paciente';

/** Alta de pacientes por el operador. Usa el mismo formulario que el registro público. */
@Component({
  selector: 'app-alta-paciente',
  imports: [FormPaciente, MatCardModule],
  template: `
    <mat-card appearance="outlined">
      <mat-card-header>
        <mat-card-title>Alta de pacientes</mat-card-title>
        <mat-card-subtitle>Cargá los datos del paciente para registrarlo</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <app-form-paciente textoBoton="Registrar paciente" (registrado)="avisar($event)" />
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
      max-width: 560px;
      margin: 16px auto;
    }
  `,
})
export class AltaPaciente {
  private readonly snackBar = inject(MatSnackBar);

  protected avisar(paciente: RegistroResponse): void {
    this.snackBar.open(
      `Paciente ${paciente.apellido}, ${paciente.nombre} registrado (DNI ${paciente.dni}).`,
      'Cerrar',
      { duration: 6000 },
    );
  }
}
