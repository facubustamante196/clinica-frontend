import {
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { catchError, finalize, forkJoin, of } from 'rxjs';

import {
  Cobertura,
  Especialidad,
  Medico,
  PacienteBusqueda,
  Sede,
  Turno,
  TurnoRequest,
} from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CoberturaService } from '../../core/services/cobertura.service';
import { DisponibilidadService } from '../../core/services/disponibilidad.service';
import { EspecialidadService } from '../../core/services/especialidad.service';
import { MedicoService } from '../../core/services/medico.service';
import { SedeService } from '../../core/services/sede.service';
import { TurnoService } from '../../core/services/turno.service';
import { fechaIso, parsearFecha } from '../../core/utils/fechas';
import { mensajeError } from '../../core/utils/mensaje-error';
import { obligatorioSinEspacios } from '../../core/utils/validadores';
import { Cargando } from '../cargando/cargando';
import { FechaPipe } from '../pipes/fecha.pipe';
import { HoraPipe } from '../pipes/hora.pipe';
import { SinResultados } from '../sin-resultados/sin-resultados';

const LARGO_MAXIMO_NOTA = 40;
const PASO_HORARIO = 4;

/**
 * Solicitud de turno paso a paso: especialidad, sede, médico, fecha, horario y nota.
 * Cada paso filtra el siguiente con datos de la API. Lo usan el paciente (turno propio)
 * y el operador (turno para el `paciente` indicado, con `sedeFija` en su sede).
 */
@Component({
  selector: 'app-nuevo-turno',
  imports: [
    ReactiveFormsModule,
    Cargando,
    FechaPipe,
    HoraPipe,
    MatButtonModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatStepperModule,
    SinResultados,
  ],
  templateUrl: './nuevo-turno.html',
  styleUrl: './nuevo-turno.scss',
})
export class NuevoTurno implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);
  private readonly especialidadService = inject(EspecialidadService);
  private readonly sedeService = inject(SedeService);
  private readonly medicoService = inject(MedicoService);
  private readonly coberturaService = inject(CoberturaService);
  private readonly disponibilidad = inject(DisponibilidadService);
  private readonly turnoService = inject(TurnoService);
  private readonly stepper = viewChild.required(MatStepper);

  /** Si se indica, la sede queda elegida y no se puede cambiar (operador). */
  readonly sedeFija = input<number | null>(null);

  /** Paciente para el que se pide el turno. Sin valor, el turno es del usuario logueado. */
  readonly paciente = input<PacienteBusqueda | null>(null);

  /** Se emite con el turno confirmado. */
  readonly creado = output<Turno>();

  protected readonly largoMaximoNota = LARGO_MAXIMO_NOTA;
  protected readonly hoy = new Date();

  protected readonly especialidades = signal<Especialidad[]>([]);
  protected readonly sedes = signal<Sede[]>([]);
  protected readonly medicos = signal<Medico[]>([]);
  protected readonly fechas = signal<string[]>([]);
  protected readonly horarios = signal<string[]>([]);
  private readonly coberturas = signal<Cobertura[]>([]);

  protected readonly idEspecialidad = signal<number | null>(null);
  protected readonly idSede = signal<number | null>(null);
  protected readonly idMedico = signal<number | null>(null);
  protected readonly fecha = signal<string | null>(null);
  protected readonly hora = signal<string | null>(null);

  protected readonly cargandoBase = signal(true);
  protected readonly errorBase = signal(false);
  protected readonly cargandoMedicos = signal(false);
  protected readonly cargandoFechas = signal(false);
  protected readonly cargandoHorarios = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);
  protected readonly turnoCreado = signal<Turno | null>(null);

  protected readonly nota = new FormControl('', {
    nonNullable: true,
    validators: [obligatorioSinEspacios, Validators.maxLength(LARGO_MAXIMO_NOTA)],
  });

  protected readonly sedeBloqueada = computed(() => this.sedeFija() !== null);

  protected readonly especialidadElegida = computed(() =>
    this.especialidades().find((e) => e.id === this.idEspecialidad()),
  );
  protected readonly sedeElegida = computed(() => this.sedes().find((s) => s.id === this.idSede()));
  protected readonly medicoElegido = computed(() =>
    this.medicos().find((m) => m.id === this.idMedico()),
  );

  protected readonly nombreCobertura = computed(() => {
    const paciente = this.paciente();
    if (paciente) {
      return paciente.cobertura_nombre ?? 'Sin cobertura';
    }
    const idCobertura = this.auth.usuario()?.id_cobertura;
    return this.coberturas().find((c) => c.id === idCobertura)?.nombre ?? 'Sin cobertura';
  });

  protected readonly fechaSeleccionada = computed(() => parsearFecha(this.fecha()));
  protected readonly primeraFecha = computed(() => parsearFecha(this.fechas()[0]) ?? this.hoy);

  /** Solo se pueden elegir los días en los que el médico tiene horarios libres. */
  protected readonly filtroFecha = computed(() => {
    const disponibles = new Set(this.fechas());
    return (dia: Date | null): boolean => dia !== null && disponibles.has(fechaIso(dia));
  });

  ngOnInit(): void {
    const sedeFija = this.sedeFija();
    if (sedeFija !== null) {
      this.idSede.set(sedeFija);
    }
    this.cargarBase();
  }

  protected cargarBase(): void {
    this.cargandoBase.set(true);
    this.errorBase.set(false);
    forkJoin({
      especialidades: this.especialidadService.listar(),
      sedes: this.sedeService.listar(),
      // Sin cobertura en pantalla igual se puede pedir el turno: la asigna el backend.
      coberturas: this.paciente()
        ? of<Cobertura[]>([])
        : this.coberturaService.listar().pipe(catchError(() => of<Cobertura[]>([]))),
    })
      .pipe(finalize(() => this.cargandoBase.set(false)))
      .subscribe({
        next: ({ especialidades, sedes, coberturas }) => {
          this.especialidades.set(especialidades);
          this.sedes.set(sedes);
          this.coberturas.set(coberturas);
        },
        error: () => this.errorBase.set(true),
      });
  }

  protected elegirEspecialidad(id: number): void {
    this.idEspecialidad.set(id);
    this.reiniciarDesdeMedico();
    this.cargarMedicos();
  }

  protected elegirSede(id: number): void {
    this.idSede.set(id);
    this.reiniciarDesdeMedico();
    this.cargarMedicos();
  }

  protected elegirMedico(id: number): void {
    this.idMedico.set(id);
    this.fecha.set(null);
    this.hora.set(null);
    this.horarios.set([]);
    this.fechas.set([]);
    this.errorEnvio.set(null);
    this.cargarFechas();
  }

  protected elegirFecha(dia: Date | null): void {
    if (!dia) {
      return;
    }
    this.fecha.set(fechaIso(dia));
    this.hora.set(null);
    this.errorEnvio.set(null);
    this.cargarHorarios();
  }

  protected elegirHora(hora: string | null): void {
    this.hora.set(hora);
    this.errorEnvio.set(null);
  }

  protected confirmar(): void {
    const idEspecialidad = this.idEspecialidad();
    const idSede = this.idSede();
    const idMedico = this.idMedico();
    const fecha = this.fecha();
    const hora = this.hora();
    if (
      this.nota.invalid ||
      this.enviando() ||
      idEspecialidad === null ||
      idSede === null ||
      idMedico === null ||
      fecha === null ||
      hora === null
    ) {
      this.nota.markAsTouched();
      return;
    }

    const datos: TurnoRequest = {
      id_especialidad: idEspecialidad,
      id_sede: idSede,
      id_medico: idMedico,
      fecha,
      hora,
      nota: this.nota.value.trim(),
      ...(this.paciente() && { id_paciente: this.paciente()!.id }),
    };

    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.turnoService
      .crear(datos)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (turno) => {
          this.turnoCreado.set(turno);
          this.creado.emit(turno);
        },
        error: (error: unknown) => {
          // Por ejemplo, el horario se ocupó: se muestra el motivo y se vuelve a elegir horario.
          this.errorEnvio.set(mensajeError(error));
          this.hora.set(null);
          this.cargarFechas();
          this.cargarHorarios();
          this.stepper().selectedIndex = PASO_HORARIO;
        },
      });
  }

  /** Vuelve al primer paso para pedir otro turno. */
  protected reiniciar(): void {
    this.turnoCreado.set(null);
    this.idEspecialidad.set(null);
    if (!this.sedeBloqueada()) {
      this.idSede.set(null);
    }
    this.reiniciarDesdeMedico();
    this.nota.reset('');
    this.stepper().reset();
  }

  private reiniciarDesdeMedico(): void {
    this.idMedico.set(null);
    this.fecha.set(null);
    this.hora.set(null);
    this.medicos.set([]);
    this.fechas.set([]);
    this.horarios.set([]);
    this.errorEnvio.set(null);
  }

  private cargarMedicos(): void {
    const idEspecialidad = this.idEspecialidad();
    const idSede = this.idSede();
    if (idEspecialidad === null || idSede === null) {
      return;
    }
    this.cargandoMedicos.set(true);
    this.medicoService
      .listar({ id_especialidad: idEspecialidad, id_sede: idSede })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoMedicos.set(false)),
      )
      .subscribe({
        next: (medicos) => {
          if (this.idEspecialidad() === idEspecialidad && this.idSede() === idSede) {
            this.medicos.set(medicos);
          }
        },
        error: () => this.medicos.set([]),
      });
  }

  private consulta() {
    const id_medico = this.idMedico();
    const id_especialidad = this.idEspecialidad();
    const id_sede = this.idSede();
    if (id_medico === null || id_especialidad === null || id_sede === null) {
      return null;
    }
    return { id_medico, id_especialidad, id_sede };
  }

  private cargarFechas(): void {
    const consulta = this.consulta();
    if (!consulta) {
      return;
    }
    this.cargandoFechas.set(true);
    this.disponibilidad
      .fechas(consulta)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoFechas.set(false)),
      )
      .subscribe({
        next: (fechas) => {
          if (this.idMedico() === consulta.id_medico) {
            this.fechas.set(fechas);
          }
        },
        error: () => this.fechas.set([]),
      });
  }

  private cargarHorarios(): void {
    const consulta = this.consulta();
    const fecha = this.fecha();
    if (!consulta || fecha === null) {
      return;
    }
    this.cargandoHorarios.set(true);
    this.disponibilidad
      .horarios(consulta, fecha)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.cargandoHorarios.set(false)),
      )
      .subscribe({
        next: (horarios) => {
          if (this.fecha() === fecha && this.idMedico() === consulta.id_medico) {
            this.horarios.set(horarios);
          }
        },
        error: () => this.horarios.set([]),
      });
  }
}
