import { DatePipe, formatDate, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, LOCALE_ID, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, finalize, forkJoin, of, switchMap } from 'rxjs';

import { ETIQUETAS_ESTADO_TURNO, HistorialClinico, Turno } from '../../../core/models';
import { HistorialService } from '../../../core/services/historial.service';
import { TurnoService } from '../../../core/services/turno.service';
import { fechaHora, horaCorta, parsearFecha } from '../../../core/utils/fechas';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { Cargando } from '../../../shared/cargando/cargando';
import { confirmar } from '../../../shared/dialogo-confirmacion/dialogo-confirmacion';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';

interface TurnoConHistorial extends Turno {
  momento: Date;
  historial: HistorialClinico | null;
}

@Component({
  selector: 'app-mis-turnos',
  imports: [
    Cargando,
    DatePipe,
    FechaPipe,
    MatButtonModule,
    MatCardModule,
    MatExpansionModule,
    MatIconModule,
    NgTemplateOutlet,
    SinResultados,
  ],
  templateUrl: './mis-turnos.html',
  styleUrl: './mis-turnos.scss',
})
export class MisTurnos implements OnInit {
  private readonly turnoService = inject(TurnoService);
  private readonly historialService = inject(HistorialService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly locale = inject(LOCALE_ID);

  protected readonly etiquetasEstado = ETIQUETAS_ESTADO_TURNO;
  protected readonly horaCorta = horaCorta;
  protected readonly parsearFecha = parsearFecha;

  private readonly turnos = signal<TurnoConHistorial[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly cancelando = signal<number | null>(null);

  protected readonly hayTurnos = computed(() => this.turnos().length > 0);

  /** Turnos confirmados que todavía no pasaron, del más cercano al más lejano. */
  protected readonly proximos = computed(() => {
    const ahora = Date.now();
    return this.turnos()
      .filter((t) => t.estado === 'confirmado' && t.momento.getTime() >= ahora)
      .sort((a, b) => a.momento.getTime() - b.momento.getTime());
  });

  /** Todo lo demás (atendidos, cancelados y vencidos), del más reciente al más antiguo. */
  protected readonly historial = computed(() => {
    const ahora = Date.now();
    return this.turnos()
      .filter((t) => !(t.estado === 'confirmado' && t.momento.getTime() >= ahora))
      .sort((a, b) => b.momento.getTime() - a.momento.getTime());
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    forkJoin({
      turnos: this.turnoService.listarMios(),
      // Si falla el historial igual se muestran los turnos.
      historial: this.historialService.listar().pipe(catchError(() => of([]))),
    })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: ({ turnos, historial }) =>
          this.turnos.set(
            turnos.map((turno) => ({
              ...turno,
              momento: fechaHora(turno.fecha, turno.hora),
              historial: historial.find((h) => h.id_turno === turno.id) ?? null,
            })),
          ),
        error: () => this.errorCarga.set(true),
      });
  }

  protected etiquetaEstado(turno: Turno): string {
    return this.etiquetasEstado[turno.estado];
  }

  protected nombreMedico(turno: Turno): string {
    const nombre = [turno.nombre_medico, turno.apellido_medico].filter(Boolean).join(' ');
    return nombre || '—';
  }

  protected cancelar(turno: TurnoConHistorial): void {
    confirmar(this.dialog, {
      titulo: 'Cancelar turno',
      mensaje: `¿Está seguro de cancelar el turno del ${this.fechaTexto(turno)} a las ${horaCorta(turno.hora)}?`,
      textoConfirmar: 'Cancelar turno',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.cancelando.set(turno.id);
          return this.turnoService
            .cancelar(turno.id)
            .pipe(finalize(() => this.cancelando.set(null)));
        }),
      )
      .subscribe({
        next: () => {
          this.turnos.update((lista) =>
            lista.map((t) => (t.id === turno.id ? { ...t, estado: 'cancelado' } : t)),
          );
          this.snackBar.open('Turno cancelado.', 'Cerrar', { duration: 4000 });
        },
        error: (error: unknown) =>
          this.snackBar.open(mensajeError(error), 'Cerrar', { duration: 6000 }),
      });
  }

  private fechaTexto(turno: Turno): string {
    const fecha = parsearFecha(turno.fecha);
    return fecha ? formatDate(fecha, 'dd/MM/yyyy', this.locale) : turno.fecha;
  }
}
