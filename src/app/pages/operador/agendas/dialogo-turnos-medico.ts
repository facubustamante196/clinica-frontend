import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { filter, finalize, switchMap } from 'rxjs';

import { Turno } from '../../../core/models';
import { TurnoService } from '../../../core/services/turno.service';
import { horaCorta } from '../../../core/utils/fechas';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { Cargando } from '../../../shared/cargando/cargando';
import { confirmar } from '../../../shared/dialogo-confirmacion/dialogo-confirmacion';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { HoraPipe } from '../../../shared/pipes/hora.pipe';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';

export interface DatosDialogoTurnosMedico {
  idMedico: number;
  nombreMedico: string;
  /** Formato YYYY-MM-DD. */
  fecha: string;
  /** Sede de la fila desde la que se abrió el diálogo. */
  idSede: number;
  /** Solo se puede cancelar en la sede del operador. */
  puedeCancelar: boolean;
}

/**
 * Turnos confirmados de un médico en una fecha y sede, con la posibilidad de cancelarlos
 * (solo en la sede del operador). Se cierra con `true` si se canceló alguno.
 */
@Component({
  selector: 'app-dialogo-turnos-medico',
  imports: [Cargando, FechaPipe, HoraPipe, MatButtonModule, MatDialogModule, MatTableModule, SinResultados],
  template: `
    <h2 mat-dialog-title>Turnos de {{ datos.nombreMedico }} · {{ datos.fecha | fecha }}</h2>

    <mat-dialog-content class="contenido">
      @if (cargando()) {
        <app-cargando mensaje="Cargando turnos…" />
      } @else if (errorCarga()) {
        <app-sin-resultados icono="cloud_off" mensaje="No se pudieron cargar los turnos." />
      } @else if (confirmados().length === 0) {
        <app-sin-resultados icono="event_busy" mensaje="No hay turnos confirmados para este día." />
      } @else {
        <div class="tabla-scroll">
        <table mat-table [dataSource]="confirmados()">
          <ng-container matColumnDef="hora">
            <th mat-header-cell *matHeaderCellDef>Hora</th>
            <td mat-cell *matCellDef="let t">{{ t.hora | hora }}</td>
          </ng-container>
          <ng-container matColumnDef="paciente">
            <th mat-header-cell *matHeaderCellDef>Paciente</th>
            <td mat-cell *matCellDef="let t">{{ t.apellido_paciente }}, {{ t.nombre_paciente }}</td>
          </ng-container>
          <ng-container matColumnDef="nota">
            <th mat-header-cell *matHeaderCellDef>Nota</th>
            <td mat-cell *matCellDef="let t">{{ t.nota || '—' }}</td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="acciones"></th>
            <td mat-cell *matCellDef="let t" class="acciones">
              @if (datos.puedeCancelar) {
                <button
                  mat-button
                  type="button"
                  [disabled]="cancelando() === t.id"
                  (click)="cancelar(t)"
                >
                  Cancelar turno
                </button>
              }
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
        </table>
        </div>
        @if (!datos.puedeCancelar) {
          <p class="aviso">Solo se pueden cancelar los turnos de tu sede.</p>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-flat-button type="button" (click)="cerrar()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .contenido {
      min-width: 560px;
    }

    table {
      width: 100%;
    }

    .acciones {
      text-align: right;
    }

    .aviso {
      color: var(--mat-sys-on-surface-variant);
      margin: 12px 0 0;
    }
  `,
})
export class DialogoTurnosMedico implements OnInit {
  private readonly turnoService = inject(TurnoService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject<MatDialogRef<DialogoTurnosMedico, boolean>>(MatDialogRef);
  protected readonly datos = inject<DatosDialogoTurnosMedico>(MAT_DIALOG_DATA);

  protected readonly columnas = ['hora', 'paciente', 'nota', 'acciones'];
  private readonly turnos = signal<Turno[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly cancelando = signal<number | null>(null);
  private huboCambios = false;

  protected readonly confirmados = computed(() =>
    this.turnos()
      .filter((t) => t.estado === 'confirmado' && t.id_sede === this.datos.idSede)
      .sort((a, b) => a.hora.localeCompare(b.hora)),
  );

  ngOnInit(): void {
    this.cargar();
  }

  protected cancelar(turno: Turno): void {
    confirmar(this.dialog, {
      titulo: 'Cancelar turno',
      mensaje: `¿Está seguro de cancelar el turno de ${turno.apellido_paciente} ${turno.nombre_paciente} a las ${horaCorta(turno.hora)}?`,
      textoConfirmar: 'Cancelar turno',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => {
          this.cancelando.set(turno.id);
          return this.turnoService.cancelar(turno.id).pipe(finalize(() => this.cancelando.set(null)));
        }),
      )
      .subscribe({
        next: () => {
          this.huboCambios = true;
          this.snackBar.open('Turno cancelado.', 'Cerrar', { duration: 4000 });
          this.cargar();
        },
        error: (error: unknown) =>
          this.snackBar.open(mensajeError(error), 'Cerrar', { duration: 6000 }),
      });
  }

  protected cerrar(): void {
    this.dialogRef.close(this.huboCambios);
  }

  private cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.turnoService
      .listar({ fecha: this.datos.fecha, id_medico: this.datos.idMedico })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (turnos) => this.turnos.set(turnos),
        error: () => this.errorCarga.set(true),
      });
  }
}
