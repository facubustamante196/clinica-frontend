import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { finalize } from 'rxjs';

import { HistorialClinico, PacienteBusqueda } from '../../../core/models';
import { HistorialService } from '../../../core/services/historial.service';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { BuscadorPaciente } from '../../../shared/buscador-paciente/buscador-paciente';
import { Cargando } from '../../../shared/cargando/cargando';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';

/**
 * Historial clínico del paciente que elige el médico. Solo se muestran los registros de
 * los turnos que atendió el médico logueado: el filtro lo aplica el backend.
 */
@Component({
  selector: 'app-historial-medico',
  imports: [
    BuscadorPaciente,
    Cargando,
    FechaPipe,
    MatCardModule,
    MatExpansionModule,
    SinResultados,
  ],
  templateUrl: './historial-medico.html',
  styleUrl: './historial-medico.scss',
})
export class HistorialMedico {
  private readonly historialService = inject(HistorialService);

  protected readonly seleccionado = signal<PacienteBusqueda | null>(null);
  protected readonly historial = signal<HistorialClinico[]>([]);
  protected readonly cargandoHistorial = signal(false);
  protected readonly errorHistorial = signal<string | null>(null);

  protected verHistorial(paciente: PacienteBusqueda): void {
    this.seleccionado.set(paciente);
    this.historial.set([]);
    this.errorHistorial.set(null);
    this.cargandoHistorial.set(true);
    this.historialService
      .listar(paciente.id)
      .pipe(finalize(() => this.cargandoHistorial.set(false)))
      .subscribe({
        next: (historial) => {
          if (this.seleccionado()?.id === paciente.id) {
            this.historial.set(historial);
          }
        },
        error: (error: unknown) => this.errorHistorial.set(mensajeError(error)),
      });
  }
}
