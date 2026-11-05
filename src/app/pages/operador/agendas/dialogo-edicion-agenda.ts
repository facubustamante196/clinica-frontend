import { Component, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, finalize, switchMap } from 'rxjs';

import { Agenda, Medico, Sede } from '../../../core/models';
import { AgendaService } from '../../../core/services/agenda.service';
import { horaCorta } from '../../../core/utils/fechas';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { Cargando } from '../../../shared/cargando/cargando';
import { DatosDialogoAgenda, DialogoAgenda } from '../../../shared/dialogo-agenda/dialogo-agenda';
import { confirmar } from '../../../shared/dialogo-confirmacion/dialogo-confirmacion';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { HoraPipe } from '../../../shared/pipes/hora.pipe';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';

export interface DatosDialogoEdicionAgenda {
  medico: Medico;
  /** Formato YYYY-MM-DD. */
  fecha: string;
  idSede: number;
  sedes: Sede[];
}

/**
 * Edición de la agenda de un médico en una fecha y sede: agregar, modificar o eliminar
 * rangos. Se cierra con `true` si hubo algún cambio, para que el listado se actualice.
 */
@Component({
  selector: 'app-dialogo-edicion-agenda',
  imports: [
    Cargando,
    FechaPipe,
    HoraPipe,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    SinResultados,
  ],
  template: `
    <h2 mat-dialog-title>
      Agenda de {{ datos.medico.nombre }} {{ datos.medico.apellido }} · {{ datos.fecha | fecha }}
    </h2>

    <mat-dialog-content class="contenido">
      @if (cargando()) {
        <app-cargando mensaje="Cargando rangos…" />
      } @else if (errorCarga()) {
        <app-sin-resultados icono="cloud_off" mensaje="No se pudo cargar la agenda." />
      } @else if (agendas().length === 0) {
        <app-sin-resultados icono="event_busy" mensaje="No hay rangos cargados para este día." />
      } @else {
        <div class="tabla-scroll">
        <table mat-table [dataSource]="agendas()">
          <ng-container matColumnDef="horario">
            <th mat-header-cell *matHeaderCellDef>Horario</th>
            <td mat-cell *matCellDef="let a">{{ a.hora_entrada | hora }} a {{ a.hora_salida | hora }}</td>
          </ng-container>
          <ng-container matColumnDef="especialidad">
            <th mat-header-cell *matHeaderCellDef>Especialidad</th>
            <td mat-cell *matCellDef="let a">{{ a.especialidad_descripcion }}</td>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef class="acciones"></th>
            <td mat-cell *matCellDef="let a" class="acciones">
              <button mat-icon-button type="button" matTooltip="Modificar" aria-label="Modificar rango" (click)="editar(a)">
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                type="button"
                matTooltip="Eliminar"
                aria-label="Eliminar rango"
                [disabled]="eliminando() === a.id"
                (click)="eliminar(a)"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columnas"></tr>
          <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
        </table>
        </div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="agregar()">
        <mat-icon>add</mat-icon>
        Agregar rango
      </button>
      <button mat-flat-button type="button" (click)="cerrar()">Cerrar</button>
    </mat-dialog-actions>
  `,
  styles: `
    .contenido {
      min-width: 520px;
    }

    table {
      width: 100%;
    }

    .acciones {
      text-align: right;
      width: 110px;
    }
  `,
})
export class DialogoEdicionAgenda implements OnInit {
  private readonly agendaService = inject(AgendaService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject<MatDialogRef<DialogoEdicionAgenda, boolean>>(MatDialogRef);
  protected readonly datos = inject<DatosDialogoEdicionAgenda>(MAT_DIALOG_DATA);

  protected readonly columnas = ['horario', 'especialidad', 'acciones'];
  protected readonly agendas = signal<Agenda[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly eliminando = signal<number | null>(null);
  private huboCambios = false;

  ngOnInit(): void {
    this.cargar();
  }

  protected agregar(): void {
    this.abrirFormulario({});
  }

  protected editar(agenda: Agenda): void {
    this.abrirFormulario({ agenda });
  }

  protected eliminar(agenda: Agenda): void {
    confirmar(this.dialog, {
      titulo: 'Eliminar rango horario',
      mensaje: `¿Está seguro de eliminar el rango de ${horaCorta(agenda.hora_entrada)} a ${horaCorta(agenda.hora_salida)}?`,
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
          this.huboCambios = true;
          this.snackBar.open('Rango horario eliminado.', 'Cerrar', { duration: 4000 });
          this.cargar();
        },
        // Por ejemplo, el rango tiene turnos confirmados: se muestra el mensaje del backend.
        error: (error: unknown) =>
          this.snackBar.open(mensajeError(error), 'Cerrar', { duration: 7000 }),
      });
  }

  protected cerrar(): void {
    this.dialogRef.close(this.huboCambios);
  }

  private abrirFormulario(parcial: Partial<DatosDialogoAgenda>): void {
    const datos: DatosDialogoAgenda = {
      medicos: [this.datos.medico],
      sedes: this.datos.sedes,
      idSedeInicial: this.datos.idSede,
      sedeBloqueada: true,
      fecha: this.datos.fecha,
      ...parcial,
    };
    this.dialog
      .open<DialogoAgenda, DatosDialogoAgenda, boolean>(DialogoAgenda, { data: datos, width: '460px' })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.huboCambios = true;
        this.snackBar.open('Agenda guardada.', 'Cerrar', { duration: 4000 });
        this.cargar();
      });
  }

  private cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.agendaService
      .listar({
        id_medico: this.datos.medico.id,
        id_sede: this.datos.idSede,
        fecha: this.datos.fecha,
      })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (agendas) =>
          this.agendas.set([...agendas].sort((a, b) => a.hora_entrada.localeCompare(b.hora_entrada))),
        error: () => this.errorCarga.set(true),
      });
  }
}
