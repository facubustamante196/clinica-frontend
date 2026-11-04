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
import { filter, finalize, merge, switchMap } from 'rxjs';

import { ETIQUETAS_ESTADO_TURNO, Sede, Turno } from '../../../core/models';
import { SedeService } from '../../../core/services/sede.service';
import { TurnoService } from '../../../core/services/turno.service';
import { calcularEdad, fechaHora, fechaIso } from '../../../core/utils/fechas';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { Cargando } from '../../../shared/cargando/cargando';
import { confirmar } from '../../../shared/dialogo-confirmacion/dialogo-confirmacion';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';
import {
  DatosDialogoAtencion,
  DialogoAtencion,
} from './dialogo-atencion';

/**
 * Turnos del médico logueado en todas las sedes donde atiende. Por defecto, los del día;
 * con selector de fecha y filtro de sede. Al hacer click en un turno se ve la nota del paciente.
 */
@Component({
  selector: 'app-turnos-medico',
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
    SinResultados,
  ],
  templateUrl: './turnos-medico.html',
  styleUrl: './turnos-medico.scss',
})
export class TurnosMedico implements OnInit {
  private readonly turnoService = inject(TurnoService);
  private readonly sedeService = inject(SedeService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly columnas = ['hora', 'paciente', 'edad', 'sede', 'estado', 'acciones'];
  protected readonly calcularEdad = calcularEdad;

  protected readonly fecha = new FormControl<Date | null>(new Date());
  /** `null` muestra todas las sedes. */
  protected readonly sede = new FormControl<number | null>(null);

  protected readonly sedes = signal<Sede[]>([]);
  private readonly turnos = signal<Turno[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly expandido = signal<number | null>(null);
  protected readonly procesando = signal<number | null>(null);

  /** Ordenados por proximidad a este momento: primero el más cercano, antes o después. */
  protected readonly ordenados = computed(() => {
    const ahora = Date.now();
    const distancia = (t: Turno) => Math.abs(fechaHora(t.fecha, t.hora).getTime() - ahora);
    return [...this.turnos()].sort((a, b) => distancia(a) - distancia(b));
  });

  ngOnInit(): void {
    this.sedeService.listar().subscribe({
      next: (sedes) => this.sedes.set(sedes),
      // Sin el listado de sedes igual se ven los turnos, sin poder filtrar por sede.
      error: () => this.sedes.set([]),
    });
    merge(this.fecha.valueChanges, this.sede.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargar());
    this.cargar();
  }

  protected cargar(): void {
    const fecha = this.fecha.value;
    if (!fecha) {
      return;
    }
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.expandido.set(null);
    this.turnoService
      .listar({ fecha: fechaIso(fecha), ...(this.sede.value !== null && { id_sede: this.sede.value }) })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (turnos) => this.turnos.set(turnos),
        error: () => this.errorCarga.set(true),
      });
  }

  protected etiqueta(turno: Turno): string {
    return ETIQUETAS_ESTADO_TURNO[turno.estado];
  }

  protected alternarDetalle(turno: Turno): void {
    this.expandido.update((actual) => (actual === turno.id ? null : turno.id));
  }

  protected atender(turno: Turno): void {
    this.dialog
      .open<DialogoAtencion, DatosDialogoAtencion, boolean>(DialogoAtencion, {
        data: { turno },
        width: '520px',
      })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.snackBar.open('Turno marcado como atendido.', 'Cerrar', { duration: 4000 });
        this.cargar();
      });
  }

  protected cancelar(turno: Turno): void {
    confirmar(this.dialog, {
      titulo: 'Cancelar turno',
      mensaje: `¿Está seguro de cancelar el turno de ${turno.apellido_paciente} ${turno.nombre_paciente} a las ${turno.hora}?`,
      textoConfirmar: 'Cancelar turno',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.procesando.set(turno.id);
          return this.turnoService.cancelar(turno.id).pipe(finalize(() => this.procesando.set(null)));
        }),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Turno cancelado.', 'Cerrar', { duration: 4000 });
          this.cargar();
        },
        error: (error: unknown) =>
          this.snackBar.open(mensajeError(error), 'Cerrar', { duration: 6000 }),
      });
  }
}
