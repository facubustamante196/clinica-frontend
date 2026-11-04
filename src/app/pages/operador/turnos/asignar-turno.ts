import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PacienteBusqueda, Turno } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { BuscadorPaciente } from '../../../shared/buscador-paciente/buscador-paciente';
import { NuevoTurno } from '../../../shared/nuevo-turno/nuevo-turno';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';

/**
 * Asignación de turnos por el operador: busca al paciente y le pide un turno con el mismo
 * flujo que el paciente, con la sede fija en la del operador.
 */
@Component({
  selector: 'app-asignar-turno',
  imports: [
    BuscadorPaciente,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    NuevoTurno,
    SinResultados,
  ],
  templateUrl: './asignar-turno.html',
  styleUrl: './asignar-turno.scss',
})
export class AsignarTurno {
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly miSede = computed(() => this.auth.usuario()?.id_sede ?? null);
  protected readonly paciente = signal<PacienteBusqueda | null>(null);

  protected elegir(paciente: PacienteBusqueda): void {
    this.paciente.set(paciente);
  }

  protected cambiarPaciente(): void {
    this.paciente.set(null);
  }

  protected avisar(turno: Turno): void {
    const p = this.paciente();
    this.snackBar.open(
      `Turno asignado a ${p?.apellido}, ${p?.nombre}: ${turno.fecha.split('-').reverse().join('/')} a las ${turno.hora}.`,
      'Cerrar',
      { duration: 6000 },
    );
  }
}
