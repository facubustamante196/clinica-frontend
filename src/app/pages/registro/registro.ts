import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';

import { FormPaciente } from '../../shared/form-paciente/form-paciente';

/** Registro público de pacientes. El formulario es el mismo que usa el operador. */
@Component({
  selector: 'app-registro',
  imports: [FormPaciente, MatButtonModule, MatCardModule, RouterLink],
  template: `
    <mat-card class="registro" appearance="outlined">
      <mat-card-header>
        <mat-card-title>Registro de pacientes</mat-card-title>
        <mat-card-subtitle>Completá tus datos para crear tu cuenta</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <app-form-paciente textoBoton="Registrarme" (registrado)="alRegistrarse()">
          <a mat-button routerLink="/login">Ya tengo cuenta</a>
        </app-form-paciente>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .registro {
      max-width: 560px;
      margin: 16px auto;
    }
  `,
})
export class Registro {
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  protected alRegistrarse(): void {
    this.snackBar.open('Registro exitoso. Ya podés iniciar sesión.', 'Cerrar', { duration: 6000 });
    this.router.navigateByUrl('/login');
  }
}
