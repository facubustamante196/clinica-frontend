import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { Turno } from '../../../core/models';
import { TurnoService } from '../../../core/services/turno.service';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { obligatorioSinEspacios } from '../../../core/utils/validadores';

/** Largo máximo de cada dato clínico (columnas del historial). */
const LARGO_MAXIMO = 255;

export interface DatosDialogoAtencion {
  turno: Turno;
}

/**
 * Marca un turno como atendido cargando diagnóstico, tratamiento y observaciones.
 * El estado y el historial se guardan juntos en el backend. Se cierra con `true` si salió
 * bien; si el backend rechaza los datos, muestra el mensaje y sigue abierto.
 */
@Component({
  selector: 'app-dialogo-atencion',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>Marcar como atendido</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      <mat-dialog-content class="contenido">
        <p class="paciente">
          {{ datos.turno.apellido_paciente }} {{ datos.turno.nombre_paciente }} ·
          {{ datos.turno.hora }}
        </p>

        <mat-form-field appearance="outline">
          <mat-label>Diagnóstico</mat-label>
          <textarea matInput rows="3" formControlName="diagnostico" [maxlength]="largoMaximo" required></textarea>
          <mat-hint align="end">{{ form.controls.diagnostico.value.length }}/{{ largoMaximo }}</mat-hint>
          @if (form.controls.diagnostico.hasError('required')) {
            <mat-error>El diagnóstico es obligatorio.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Tratamiento</mat-label>
          <textarea matInput rows="3" formControlName="tratamiento" [maxlength]="largoMaximo" required></textarea>
          <mat-hint align="end">{{ form.controls.tratamiento.value.length }}/{{ largoMaximo }}</mat-hint>
          @if (form.controls.tratamiento.hasError('required')) {
            <mat-error>El tratamiento es obligatorio.</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Observaciones</mat-label>
          <textarea matInput rows="2" formControlName="observaciones" [maxlength]="largoMaximo"></textarea>
          <mat-hint align="end">{{ form.controls.observaciones.value.length }}/{{ largoMaximo }}</mat-hint>
        </mat-form-field>

        @if (errorEnvio(); as error) {
          <p class="error" role="alert">{{ error }}</p>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" [mat-dialog-close]="false">Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="form.invalid || enviando()">
          @if (enviando()) {
            <mat-spinner diameter="18" />
          }
          Marcar como atendido
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    .contenido {
      display: flex;
      flex-direction: column;
      min-width: 440px;
      padding-top: 8px;
    }

    .paciente {
      margin: 0 0 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .error {
      color: var(--mat-sys-error);
      margin: 0 0 8px;
    }
  `,
})
export class DialogoAtencion {
  private readonly turnoService = inject(TurnoService);
  private readonly dialogRef = inject<MatDialogRef<DialogoAtencion, boolean>>(MatDialogRef);
  protected readonly datos = inject<DatosDialogoAtencion>(MAT_DIALOG_DATA);

  protected readonly largoMaximo = LARGO_MAXIMO;
  protected readonly enviando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);

  protected readonly form = new FormGroup({
    diagnostico: new FormControl('', {
      nonNullable: true,
      validators: [obligatorioSinEspacios, Validators.maxLength(LARGO_MAXIMO)],
    }),
    tratamiento: new FormControl('', {
      nonNullable: true,
      validators: [obligatorioSinEspacios, Validators.maxLength(LARGO_MAXIMO)],
    }),
    observaciones: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(LARGO_MAXIMO)],
    }),
  });

  protected guardar(): void {
    if (this.form.invalid || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }
    const { diagnostico, tratamiento, observaciones } = this.form.getRawValue();
    this.enviando.set(true);
    this.errorEnvio.set(null);
    this.turnoService
      .atender(this.datos.turno.id, {
        diagnostico: diagnostico.trim(),
        tratamiento: tratamiento.trim(),
        ...(observaciones.trim() && { observaciones: observaciones.trim() }),
      })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (error: unknown) => this.errorEnvio.set(mensajeError(error)),
      });
  }
}
