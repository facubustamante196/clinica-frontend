import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { Cobertura, RegistroRequest } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CoberturaService } from '../../core/services/cobertura.service';

const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PATRON_DNI = /^\d+$/;
const LARGO_MINIMO_PASSWORD = 6;

@Component({
  selector: 'app-registro',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'es-AR' }],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly coberturaService = inject(CoberturaService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

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
      fecha_nacimiento: this.formatearFecha(valores.fechaNacimiento!),
      id_cobertura: valores.idCobertura!,
    };

    this.cargando.set(true);
    this.auth
      .registrar(datos)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => {
          this.snackBar.open('Registro exitoso. Ya podés iniciar sesión.', 'Cerrar', {
            duration: 6000,
          });
          this.router.navigateByUrl('/login');
        },
        error: (error: unknown) => this.errorEnvio.set(this.mensajeDeError(error)),
      });
  }

  /** YYYY-MM-DD con la fecha local, sin el corrimiento de zona horaria de toISOString(). */
  private formatearFecha(fecha: Date): string {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  private mensajeDeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Intentá de nuevo más tarde.';
      }
      if (error.status === HttpStatusCode.Conflict) {
        return 'Ya existe un usuario registrado con ese DNI o email. Si ya tenés cuenta, iniciá sesión.';
      }
      if (error.error?.mensaje) {
        return error.error.mensaje;
      }
    }
    return 'No se pudo completar el registro. Intentá de nuevo.';
  }
}
