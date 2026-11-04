import { Component, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import { PacienteBusqueda } from '../../core/models';
import { PacienteService } from '../../core/services/paciente.service';
import { calcularEdad } from '../../core/utils/fechas';
import { mensajeError } from '../../core/utils/mensaje-error';
import { Cargando } from '../cargando/cargando';
import { SinResultados } from '../sin-resultados/sin-resultados';

const PATRON_DNI = /^\d{1,8}$/;

/** Hay que completar al menos uno de los dos filtros de búsqueda. */
export function dniOApellido(grupo: AbstractControl): ValidationErrors | null {
  const dni = (grupo.get('dni')?.value ?? '').trim();
  const apellido = (grupo.get('apellido')?.value ?? '').trim();
  return dni || apellido ? null : { faltaFiltro: true };
}

/**
 * Búsqueda de pacientes por DNI o apellido. Lista los resultados y emite el paciente
 * cuando el usuario toca el botón de acción de su fila. Lo usan el médico (historial)
 * y el operador (asignar turno).
 */
@Component({
  selector: 'app-buscador-paciente',
  imports: [
    ReactiveFormsModule,
    Cargando,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    SinResultados,
  ],
  templateUrl: './buscador-paciente.html',
  styleUrl: './buscador-paciente.scss',
})
export class BuscadorPaciente {
  private readonly pacienteService = inject(PacienteService);

  /** Texto del botón de cada fila. */
  readonly textoAccion = input('Seleccionar');

  /** Paciente resaltado en la lista, si hay uno elegido. */
  readonly resaltado = input<number | null>(null);

  /** Se emite con el paciente de la fila elegida. */
  readonly elegido = output<PacienteBusqueda>();

  protected readonly columnas = ['paciente', 'dni', 'edad', 'cobertura', 'acciones'];
  protected readonly calcularEdad = calcularEdad;

  protected readonly busqueda = new FormGroup(
    {
      dni: new FormControl('', { nonNullable: true, validators: [Validators.pattern(PATRON_DNI)] }),
      apellido: new FormControl('', {
        nonNullable: true,
        validators: [Validators.minLength(2), Validators.maxLength(30)],
      }),
    },
    { validators: [dniOApellido] },
  );

  protected readonly pacientes = signal<PacienteBusqueda[] | null>(null);
  protected readonly buscando = signal(false);
  protected readonly errorBusqueda = signal<string | null>(null);

  protected buscar(): void {
    if (this.busqueda.invalid || this.buscando()) {
      this.busqueda.markAllAsTouched();
      return;
    }
    const { dni, apellido } = this.busqueda.getRawValue();
    this.buscando.set(true);
    this.errorBusqueda.set(null);
    this.pacienteService
      .buscar({ dni: dni.trim(), apellido: apellido.trim() })
      .pipe(finalize(() => this.buscando.set(false)))
      .subscribe({
        next: (pacientes) => this.pacientes.set(pacientes),
        error: (error: unknown) => {
          this.pacientes.set(null);
          this.errorBusqueda.set(mensajeError(error));
        },
      });
  }
}
