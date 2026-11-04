import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, finalize, merge, Observable, of, tap } from 'rxjs';

import { Agenda, Medico, Sede } from '../../../core/models';
import { AgendaService } from '../../../core/services/agenda.service';
import { AuthService } from '../../../core/services/auth.service';
import { MedicoService } from '../../../core/services/medico.service';
import { SedeService } from '../../../core/services/sede.service';
import { fechaIso } from '../../../core/utils/fechas';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { Cargando } from '../../../shared/cargando/cargando';
import { DatosDialogoAgenda, DialogoAgenda } from '../../../shared/dialogo-agenda/dialogo-agenda';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';
import {
  DatosDialogoEdicionAgenda,
  DialogoEdicionAgenda,
} from './dialogo-edicion-agenda';
import { DatosDialogoTurnosMedico, DialogoTurnosMedico } from './dialogo-turnos-medico';

const AVISO_OTRA_SEDE = 'Solo podés modificar la agenda y los turnos de tu sede';

/**
 * Agenda y turnos del operador: médicos con agenda en una fecha y sede (la suya por defecto).
 * Puede consultar otras sedes, pero solo modifica la suya.
 */
@Component({
  selector: 'app-agendas-operador',
  imports: [
    ReactiveFormsModule,
    Cargando,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    SinResultados,
  ],
  templateUrl: './agendas-operador.html',
  styleUrl: './agendas-operador.scss',
})
export class AgendasOperador implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly agendaService = inject(AgendaService);
  private readonly medicoService = inject(MedicoService);
  private readonly sedeService = inject(SedeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly avisoOtraSede = AVISO_OTRA_SEDE;
  protected readonly columnas = ['medico', 'especialidad', 'horario', 'acciones'];

  protected readonly miSede = computed(() => this.auth.usuario()?.id_sede ?? null);
  protected readonly fecha = new FormControl<Date | null>(new Date());
  protected readonly sede = new FormControl<number | null>(null);
  private readonly sedeElegida = signal<number | null>(null);

  protected readonly sedes = signal<Sede[]>([]);
  private readonly agendas = signal<Agenda[]>([]);
  private medicos: Medico[] | null = null;

  protected readonly ordenadas = computed(() =>
    [...this.agendas()].sort(
      (a, b) =>
        a.hora_entrada.localeCompare(b.hora_entrada) ||
        a.medico_apellido.localeCompare(b.medico_apellido),
    ),
  );
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly preparando = signal(false);

  /** Solo se pueden modificar la agenda y los turnos de la sede del operador. */
  protected readonly puedeModificar = computed(
    () => this.miSede() !== null && this.sedeElegida() === this.miSede(),
  );

  ngOnInit(): void {
    this.sede.setValue(this.miSede());
    this.sedeElegida.set(this.miSede());
    this.sedeService.listar().subscribe({
      next: (sedes) => this.sedes.set(sedes),
      error: () => this.sedes.set([]),
    });
    this.sede.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((id) => {
      this.sedeElegida.set(id);
    });
    merge(this.fecha.valueChanges, this.sede.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargar());
    this.cargar();
  }

  protected cargar(): void {
    const fecha = this.fecha.value;
    const idSede = this.sede.value;
    if (!fecha || idSede === null) {
      this.cargando.set(false);
      this.agendas.set([]);
      return;
    }
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.agendaService
      .listar({ fecha: fechaIso(fecha), id_sede: idSede })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (agendas) => this.agendas.set(agendas),
        error: () => this.errorCarga.set(true),
      });
  }

  /** Alta de agenda para cualquier médico en la sede del operador, aunque no tenga agenda previa. */
  protected nuevaAgenda(): void {
    this.conMedicos((medicos) => {
      const datos: DatosDialogoAgenda = {
        medicos,
        sedes: this.sedes().filter((s) => s.id === this.miSede()),
        idSedeInicial: this.miSede(),
        sedeBloqueada: true,
        fecha: this.fecha.value ? fechaIso(this.fecha.value) : undefined,
      };
      this.dialog
        .open<DialogoAgenda, DatosDialogoAgenda, boolean>(DialogoAgenda, {
          data: datos,
          width: '460px',
        })
        .afterClosed()
        .pipe(filter(Boolean))
        .subscribe(() => {
          this.snackBar.open('Agenda guardada.', 'Cerrar', { duration: 4000 });
          this.cargar();
        });
    });
  }

  /** Lápiz: agregar, modificar o eliminar los rangos del médico en esa fecha. */
  protected editar(agenda: Agenda): void {
    const idSede = this.miSede();
    const fecha = this.fecha.value;
    if (idSede === null || !fecha) {
      return;
    }
    this.conMedicos((medicos) => {
      const medico = medicos.find((m) => m.id === agenda.id_medico);
      if (!medico) {
        this.snackBar.open('No se encontró al médico.', 'Cerrar', { duration: 5000 });
        return;
      }
      const datos: DatosDialogoEdicionAgenda = {
        medico,
        fecha: fechaIso(fecha),
        idSede,
        sedes: this.sedes().filter((s) => s.id === idSede),
      };
      this.dialog
        .open<DialogoEdicionAgenda, DatosDialogoEdicionAgenda, boolean>(DialogoEdicionAgenda, {
          data: datos,
          width: '640px',
        })
        .afterClosed()
        .subscribe((huboCambios) => {
          if (huboCambios) {
            this.cargar();
          }
        });
    });
  }

  /** Ojo: turnos confirmados del médico en esa fecha, con posibilidad de cancelarlos. */
  protected verTurnos(agenda: Agenda): void {
    const fecha = this.fecha.value;
    if (!fecha) {
      return;
    }
    const datos: DatosDialogoTurnosMedico = {
      idMedico: agenda.id_medico,
      nombreMedico: `${agenda.medico_nombre} ${agenda.medico_apellido}`,
      fecha: fechaIso(fecha),
      idSede: agenda.id_sede,
      puedeCancelar: agenda.id_sede === this.miSede(),
    };
    this.dialog.open<DialogoTurnosMedico, DatosDialogoTurnosMedico, boolean>(DialogoTurnosMedico, {
      data: datos,
      width: '680px',
    });
  }

  /** Carga (una vez) todos los médicos y ejecuta la acción; si falla avisa y no hace nada. */
  private conMedicos(accion: (medicos: Medico[]) => void): void {
    const obtener: Observable<Medico[]> = this.medicos
      ? of(this.medicos)
      : this.medicoService.listar().pipe(tap((medicos) => (this.medicos = medicos)));
    this.preparando.set(true);
    obtener.pipe(finalize(() => this.preparando.set(false))).subscribe({
      next: accion,
      error: (error: unknown) =>
        this.snackBar.open(mensajeError(error), 'Cerrar', { duration: 6000 }),
    });
  }
}
