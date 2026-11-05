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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, finalize, forkJoin, switchMap } from 'rxjs';

import { Agenda, Medico, Sede } from '../../../core/models';
import { AgendaService } from '../../../core/services/agenda.service';
import { AuthService } from '../../../core/services/auth.service';
import { MedicoService } from '../../../core/services/medico.service';
import { SedeService } from '../../../core/services/sede.service';
import { fechaIso, horaCorta } from '../../../core/utils/fechas';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { Cargando } from '../../../shared/cargando/cargando';
import { confirmar } from '../../../shared/dialogo-confirmacion/dialogo-confirmacion';
import {
  DatosDialogoAgenda,
  DialogoAgenda,
} from '../../../shared/dialogo-agenda/dialogo-agenda';
import { HoraPipe } from '../../../shared/pipes/hora.pipe';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';

/** Agenda del médico logueado: por defecto la del día, con alta, modificación y baja de rangos. */
@Component({
  selector: 'app-agenda-medico',
  imports: [
    ReactiveFormsModule,
    Cargando,
    HoraPipe,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
    SinResultados,
  ],
  templateUrl: './agenda-medico.html',
  styleUrl: './agenda-medico.scss',
})
export class AgendaMedico implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly agendaService = inject(AgendaService);
  private readonly medicoService = inject(MedicoService);
  private readonly sedeService = inject(SedeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columnas = ['horario', 'especialidad', 'sede', 'acciones'];
  protected readonly fecha = new FormControl<Date | null>(new Date());

  private readonly sedes = signal<Sede[]>([]);
  private readonly yo = signal<Medico | null>(null);
  private readonly agendas = signal<Agenda[]>([]);

  protected readonly ordenadas = computed(() =>
    [...this.agendas()].sort((a, b) => a.hora_entrada.localeCompare(b.hora_entrada)),
  );
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly eliminando = signal<number | null>(null);

  ngOnInit(): void {
    this.fecha.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (this.fecha.value) {
        this.cargarAgendas();
      }
    });
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    forkJoin({ sedes: this.sedeService.listar(), medicos: this.medicoService.listar() }).subscribe({
      next: ({ sedes, medicos }) => {
        const yo = medicos.find((m) => m.id === this.auth.usuario()?.id) ?? null;
        if (!yo) {
          this.errorCarga.set(true);
          this.cargando.set(false);
          return;
        }
        this.sedes.set(sedes);
        this.yo.set(yo);
        this.cargarAgendas();
      },
      error: () => {
        this.errorCarga.set(true);
        this.cargando.set(false);
      },
    });
  }

  protected nuevo(): void {
    this.abrirDialogo({});
  }

  protected editar(agenda: Agenda): void {
    this.abrirDialogo({ agenda });
  }

  protected eliminar(agenda: Agenda): void {
    confirmar(this.dialog, {
      titulo: 'Eliminar rango horario',
      mensaje: `¿Está seguro de eliminar el rango de ${horaCorta(agenda.hora_entrada)} a ${horaCorta(agenda.hora_salida)} en ${agenda.sede_nombre}?`,
      textoConfirmar: 'Eliminar',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.eliminando.set(agenda.id);
          return this.agendaService
            .eliminar(agenda.id)
            .pipe(finalize(() => this.eliminando.set(null)));
        }),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Rango horario eliminado.', 'Cerrar', { duration: 4000 });
          this.cargarAgendas();
        },
        // Por ejemplo, el rango tiene turnos confirmados: se muestra el mensaje del backend.
        error: (error: unknown) =>
          this.snackBar.open(mensajeError(error), 'Cerrar', { duration: 7000 }),
      });
  }

  private abrirDialogo(parcial: Partial<DatosDialogoAgenda>): void {
    const yo = this.yo();
    if (!yo) {
      return;
    }
    const datos: DatosDialogoAgenda = {
      medicos: [yo],
      sedes: this.sedes(),
      idSedeInicial: this.auth.usuario()?.id_sede ?? null,
      fecha: this.fecha.value ? fechaIso(this.fecha.value) : undefined,
      ...parcial,
    };
    this.dialog
      .open<DialogoAgenda, DatosDialogoAgenda, boolean>(DialogoAgenda, { data: datos, width: '460px' })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.snackBar.open('Agenda guardada.', 'Cerrar', { duration: 4000 });
        this.cargarAgendas();
      });
  }

  private cargarAgendas(): void {
    const fecha = this.fecha.value;
    if (!fecha) {
      return;
    }
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.agendaService
      .listar({ fecha: fechaIso(fecha) })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (agendas) => this.agendas.set(agendas),
        error: () => this.errorCarga.set(true),
      });
  }
}
