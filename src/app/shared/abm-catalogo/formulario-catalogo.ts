import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize, Observable } from 'rxjs';

import { mensajeError } from '../../core/utils/mensaje-error';
import { obligatorioSinEspacios } from '../../core/utils/validadores';
import { CampoCatalogo } from './abm-catalogo.config';

export interface DatosFormularioCatalogo {
  titulo: string;
  campos: CampoCatalogo<Record<string, unknown>>[];
  valores?: Record<string, unknown>;
  /** Envía los datos al backend; el diálogo se cierra solo si sale bien. */
  guardar: (datos: Record<string, string>) => Observable<unknown>;
}

/** Diálogo de alta y modificación. Muestra el error del backend sin cerrarse. */
@Component({
  selector: 'app-formulario-catalogo',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <form [formGroup]="form" (ngSubmit)="guardar()" novalidate>
      <mat-dialog-content>
        @if (error(); as mensaje) {
          <div class="alerta" role="alert">
            <mat-icon>error</mat-icon>
            <span>{{ mensaje }}</span>
          </div>
        }
        @for (campo of datos.campos; track campo.nombre) {
          <mat-form-field>
            <mat-label>{{ campo.etiqueta }}</mat-label>
            <input matInput [formControlName]="campo.nombre" [maxlength]="campo.maxLength" />
            <mat-hint align="end">
              {{ form.controls[campo.nombre].value.length }} / {{ campo.maxLength }}
            </mat-hint>
            @if (form.controls[campo.nombre].hasError('required')) {
              <mat-error>{{ campo.etiqueta }} es obligatorio.</mat-error>
            } @else if (form.controls[campo.nombre].hasError('pattern')) {
              <mat-error>{{ campo.mensajePatron }}</mat-error>
            }
          </mat-form-field>
        }
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close [disabled]="guardando()">Cancelar</button>
        <button mat-flat-button type="submit" [disabled]="guardando()">
          @if (guardando()) {
            <mat-spinner diameter="20" />
          } @else {
            Guardar
          }
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: `
    mat-form-field {
      display: block;
      width: 100%;
    }

    .alerta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      background-color: var(--mat-sys-error-container);
      color: var(--mat-sys-on-error-container);
    }
  `,
})
export class FormularioCatalogo {
  private readonly dialogRef = inject(MatDialogRef<FormularioCatalogo, boolean>);
  protected readonly datos = inject<DatosFormularioCatalogo>(MAT_DIALOG_DATA);

  protected readonly guardando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = new FormGroup(
    Object.fromEntries(
      this.datos.campos.map((campo) => [
        campo.nombre,
        new FormControl(String(this.datos.valores?.[campo.nombre] ?? ''), {
          nonNullable: true,
          validators: [
            obligatorioSinEspacios,
            Validators.maxLength(campo.maxLength),
            ...(campo.patron ? [Validators.pattern(campo.patron)] : []),
          ],
        }),
      ]),
    ),
  );

  protected guardar(): void {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = Object.fromEntries(
      Object.entries(this.form.getRawValue()).map(([clave, valor]) => [clave, valor.trim()]),
    );

    this.guardando.set(true);
    this.datos
      .guardar(valores)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (error: unknown) => this.error.set(mensajeError(error)),
      });
  }
}
