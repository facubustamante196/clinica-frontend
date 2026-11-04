import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';

import { Agenda, AgendaRequest, Medico, Sede } from '../../core/models';
import { AgendaService } from '../../core/services/agenda.service';
import { fechaIso, parsearFecha } from '../../core/utils/fechas';
import { mensajeError } from '../../core/utils/mensaje-error';

export interface DatosDialogoAgenda {
  /** Con `agenda` es una modificación; sin ella, un alta. */
  agenda?: Agenda;
  /** Médicos entre los que se puede elegir. Con uno solo queda elegido y bloqueado. */
  medicos: Medico[];
  /** Sedes para elegir (siempre desde la API). */
  sedes: Sede[];
  /** Sede preseleccionada en el alta. */
  idSedeInicial?: number | null;
  /** Si es verdadero la sede no se puede cambiar (operador en su sede). */
  sedeBloqueada?: boolean;
  /** Fecha inicial del alta (YYYY-MM-DD). */
  fecha?: string;
  /** Médico preseleccionado en el alta. */
  idMedicoInicial?: number | null;
}

/** La hora de salida tiene que ser posterior a la de entrada (formato HH:MM). */
export function salidaPosteriorAEntrada(grupo: AbstractControl): ValidationErrors | null {
  const entrada: string = grupo.get('hora_entrada')?.value ?? '';
  const salida: string = grupo.get('hora_salida')?.value ?? '';
  if (!entrada || !salida) {
    return null;
  }
  return salida > entrada ? null : { salidaAnterior: true };
}

/**
 * Alta y modificación de un rango horario. Lo usan el médico (su propia agenda) y el
 * operador (la agenda de un médico en su sede). Se cierra con `true` si se guardó; si el
 * backend rechaza el cambio (por ejemplo, turnos confirmados) muestra el mensaje y sigue abierto.
 */
@Component({
  selector: 'app-dialogo-agenda',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './dialogo-agenda.html',
  styleUrl: './dialogo-agenda.scss',
})
export class DialogoAgenda {
  private readonly agendaService = inject(AgendaService);
  private readonly dialogRef = inject<MatDialogRef<DialogoAgenda, boolean>>(MatDialogRef);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly datos = inject<DatosDialogoAgenda>(MAT_DIALOG_DATA);

  protected readonly esEdicion = !!this.datos.agenda;
  protected readonly medicoBloqueado = this.esEdicion || this.datos.medicos.length === 1;

  protected readonly form = new FormGroup(
    {
      id_medico: new FormControl<number | null>(
        this.datos.agenda?.id_medico ??
          this.datos.idMedicoInicial ??
          (this.datos.medicos.length === 1 ? this.datos.medicos[0].id : null),
        { validators: [Validators.required] },
      ),
      id_especialidad: new FormControl<number | null>(this.datos.agenda?.id_especialidad ?? null, {
        validators: [Validators.required],
      }),
      id_sede: new FormControl<number | null>(
        this.datos.agenda?.id_sede ?? this.datos.idSedeInicial ?? null,
        { validators: [Validators.required] },
      ),
      fecha: new FormControl<Date | null>(
        parsearFecha(this.datos.agenda?.fecha ?? this.datos.fecha) ?? new Date(),
        { validators: [Validators.required] },
      ),
      hora_entrada: new FormControl(this.datos.agenda?.hora_entrada ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      hora_salida: new FormControl(this.datos.agenda?.hora_salida ?? '', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [salidaPosteriorAEntrada] },
  );

  private readonly idMedico = signal(this.form.controls.id_medico.value);

  /** La especialidad se elige entre las del médico seleccionado. */
  protected readonly especialidades = computed(
    () => this.datos.medicos.find((m) => m.id === this.idMedico())?.especialidades ?? [],
  );

  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);

  constructor() {
    this.form.controls.id_medico.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((id) => {
        this.idMedico.set(id);
        const actual = this.form.controls.id_especialidad.value;
        if (!this.especialidades().some((e) => e.id === actual)) {
          this.form.controls.id_especialidad.setValue(
            this.especialidades().length === 1 ? this.especialidades()[0].id : null,
          );
        }
      });

    if (this.especialidades().length === 1 && !this.esEdicion) {
      this.form.controls.id_especialidad.setValue(this.especialidades()[0].id);
    }
    if (this.datos.sedeBloqueada) {
      this.form.controls.id_sede.disable();
    }
    if (this.medicoBloqueado) {
      this.form.controls.id_medico.disable();
    }
  }

  protected guardar(): void {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const datos: AgendaRequest = {
      fecha: fechaIso(v.fecha as Date),
      hora_entrada: v.hora_entrada,
      hora_salida: v.hora_salida,
      id_medico: v.id_medico as number,
      id_especialidad: v.id_especialidad as number,
      id_sede: v.id_sede as number,
    };

    this.enviando.set(true);
    this.errorEnvio.set(null);
    const peticion = this.datos.agenda
      ? this.agendaService.modificar(this.datos.agenda.id, datos)
      : this.agendaService.crear(datos);
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: () => this.dialogRef.close(true),
      error: (error: unknown) => this.errorEnvio.set(mensajeError(error)),
    });
  }
}
