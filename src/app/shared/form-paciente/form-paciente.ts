import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, inject, input, output, signal, viewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroupDirective,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize } from 'rxjs';

import { Cobertura, RegistroRequest, RegistroResponse } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CoberturaService } from '../../core/services/cobertura.service';
import { fechaIso } from '../../core/utils/fechas';
import { mensajeError } from '../../core/utils/mensaje-error';

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PATRON_DNI = /^\d+$/;
const LARGO_MINIMO_PASSWORD = 6;

/**
 * Formulario de alta de paciente. Lo usan el registro público y el operador.
 * Envía el alta, emite `registrado` si sale bien y queda vacío para cargar otro.
 * Lo que se proyecte dentro (por ejemplo, un link) se muestra debajo del botón.
 */
@Component({
  selector: 'app-form-paciente',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './form-paciente.html',
  styleUrl: './form-paciente.scss',
})
export class FormPaciente {
  private readonly auth = inject(AuthService);
  private readonly coberturaService = inject(CoberturaService);
  private readonly formDirective = viewChild.required(FormGroupDirective);

  /** Texto del botón de envío. */
  readonly textoBoton = input('Registrar');

  /** Se emite con el paciente creado. */
  readonly registrado = output<RegistroResponse>();

  protected readonly largoMinimoPassword = LARGO_MINIMO_PASSWORD;
  protected readonly hoy = new Date();

  protected readonly form = inject(FormBuilder).group({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    apellido: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    dni: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PATRON_DNI)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PATRON_EMAIL)],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(LARGO_MINIMO_PASSWORD)],
    }),
    fechaNacimiento: new FormControl<Date | null>(null, [Validators.required]),
    idCobertura: new FormControl<number | null>(null, [Validators.required]),
  });

  protected readonly coberturas = signal<Cobertura[]>([]);
  protected readonly cargandoCoberturas = signal(true);
  protected readonly errorCoberturas = signal(false);

  protected readonly cargando = signal(false);
  protected readonly ocultarPassword = signal(true);
  /** Error devuelto por el backend (DNI/email duplicado, conexión, etc.). */
  protected readonly errorEnvio = signal<string | null>(null);

  constructor() {
    this.cargarCoberturas();
  }

  protected cargarCoberturas(): void {
    this.cargandoCoberturas.set(true);
    this.errorCoberturas.set(false);
    this.coberturaService
      .listar()
      .pipe(finalize(() => this.cargandoCoberturas.set(false)))
      .subscribe({
        next: (coberturas) => this.coberturas.set(coberturas),
        error: () => this.errorCoberturas.set(true),
      });
  }

  protected registrar(): void {
    this.errorEnvio.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const datos: RegistroRequest = {
      nombre: valores.nombre.trim(),
      apellido: valores.apellido.trim(),
      dni: valores.dni.trim(),
      email: valores.email.trim(),
      password: valores.password,
      fecha_nacimiento: fechaIso(valores.fechaNacimiento!),
      id_cobertura: valores.idCobertura!,
    };

    this.cargando.set(true);
    this.auth
      .registrar(datos)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (paciente) => {
          this.formDirective().resetForm();
          this.registrado.emit(paciente);
        },
        error: (error: unknown) => this.errorEnvio.set(this.mensajeDeError(error)),
      });
  }

  private mensajeDeError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === HttpStatusCode.Conflict) {
      return 'Ya existe un usuario registrado con ese DNI o email.';
    }
    return mensajeError(error, 'No se pudo completar el alta. Intentá de nuevo.');
  }
}
