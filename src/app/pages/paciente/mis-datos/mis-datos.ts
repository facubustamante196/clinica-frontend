import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  FormGroupDirective,
  NgForm,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin } from 'rxjs';

import { ActualizarPerfilRequest, Cobertura, Usuario } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { CoberturaService } from '../../../core/services/cobertura.service';
import { mensajeError } from '../../../core/utils/mensaje-error';
import {
  camposCoinciden,
  LARGO_MINIMO_PASSWORD,
  PATRON_EMAIL,
} from '../../../core/utils/validadores';
import { Cargando } from '../../../shared/cargando/cargando';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';

const LARGO_MAXIMO_EMAIL = 30;
const PATRON_TELEFONO = /^\d{6,10}$/;

/** Marca la repetición con error cuando el grupo de contraseñas no coincide. */
class ErrorRepeticion implements ErrorStateMatcher {
  isErrorState(control: AbstractControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const grupo = control?.parent;
    return Boolean(
      grupo?.hasError('noCoinciden') && (control?.touched || control?.dirty || form?.submitted),
    );
  }
}

/**
 * Datos personales del paciente. Solo se modifican email, teléfono, cobertura y
 * contraseña; el resto se muestra en modo lectura. Se envían solo los campos que cambian.
 */
@Component({
  selector: 'app-mis-datos',
  imports: [
    Cargando,
    FechaPipe,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './mis-datos.html',
  styleUrl: './mis-datos.scss',
})
export class MisDatos {
  private readonly auth = inject(AuthService);
  private readonly coberturaService = inject(CoberturaService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuario = this.auth.usuario;
  protected readonly largoMaximoEmail = LARGO_MAXIMO_EMAIL;
  protected readonly largoMinimoPassword = LARGO_MINIMO_PASSWORD;
  protected readonly errorRepeticion = new ErrorRepeticion();

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(PATRON_EMAIL),
        Validators.maxLength(LARGO_MAXIMO_EMAIL),
      ],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: Validators.pattern(PATRON_TELEFONO),
    }),
    idCobertura: new FormControl<number | null>(null, Validators.required),
    contrasenias: new FormGroup(
      {
        nueva: new FormControl('', {
          nonNullable: true,
          validators: Validators.minLength(LARGO_MINIMO_PASSWORD),
        }),
        repetir: new FormControl('', { nonNullable: true }),
      },
      { validators: camposCoinciden('nueva', 'repetir') },
    ),
  });

  /** Se recalcula con cada cambio del formulario (la app no usa Zone.js). */
  private readonly valores = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  /** Solo lo que difiere de los datos actuales del paciente. */
  protected readonly cambios = computed<ActualizarPerfilRequest>(() => {
    this.valores();
    const usuario = this.usuario();
    if (!usuario) {
      return {};
    }
    const { email, telefono, idCobertura, contrasenias } = this.form.getRawValue();
    const cambios: ActualizarPerfilRequest = {};
    if (email.trim() !== usuario.email) {
      cambios.email = email.trim();
    }
    if (telefono.trim() && telefono.trim() !== (usuario.telefono ?? '')) {
      cambios.telefono = telefono.trim();
    }
    if (idCobertura !== null && idCobertura !== usuario.id_cobertura) {
      cambios.id_cobertura = idCobertura;
    }
    if (contrasenias.nueva) {
      cambios.password = contrasenias.nueva;
    }
    return cambios;
  });
  protected readonly hayCambios = computed(() => Object.keys(this.cambios()).length > 0);

  protected readonly coberturas = signal<Cobertura[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);
  protected readonly ocultarPassword = signal(true);

  constructor() {
    this.cargar();
  }

  /** Trae el perfil actualizado y las coberturas para elegir. */
  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    forkJoin({ usuario: this.auth.obtenerPerfil(), coberturas: this.coberturaService.listar() })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ usuario, coberturas }) => {
          this.coberturas.set(coberturas);
          this.precargar(usuario);
        },
        error: (error: unknown) =>
          this.errorCarga.set(mensajeError(error, 'No se pudieron cargar tus datos.')),
      });
  }

  protected guardar(): void {
    this.errorEnvio.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.hayCambios()) {
      return;
    }

    this.guardando.set(true);
    this.auth
      .actualizarPerfil(this.cambios())
      .pipe(
        finalize(() => this.guardando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (usuario) => {
          this.precargar(usuario);
          this.snackBar.open('Tus datos se actualizaron.', 'Cerrar', { duration: 4000 });
        },
        error: (error: unknown) =>
          this.errorEnvio.set(mensajeError(error, 'No se pudieron guardar tus datos.')),
      });
  }

  /** Carga los datos actuales y vacía las contraseñas. */
  private precargar(usuario: Usuario): void {
    // Si ya tenía teléfono no se puede borrar: el backend no acepta un teléfono vacío.
    const telefono = this.form.controls.telefono;
    telefono.setValidators(
      usuario.telefono
        ? [Validators.required, Validators.pattern(PATRON_TELEFONO)]
        : Validators.pattern(PATRON_TELEFONO),
    );
    this.form.reset({
      email: usuario.email,
      telefono: usuario.telefono ?? '',
      idCobertura: usuario.id_cobertura,
      contrasenias: { nueva: '', repetir: '' },
    });
  }
}
