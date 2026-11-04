import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { finalize, forkJoin, Observable, of } from 'rxjs';

import {
  Cobertura,
  Especialidad,
  ETIQUETAS_ROL,
  Rol,
  RolAlta,
  ROLES_ALTA,
  Sede,
  UsuarioDetalle,
} from '../../../../core/models';
import { CoberturaService } from '../../../../core/services/cobertura.service';
import { EspecialidadService } from '../../../../core/services/especialidad.service';
import { SedeService } from '../../../../core/services/sede.service';
import { UsuarioService } from '../../../../core/services/usuario.service';
import { fechaIso, parsearFecha } from '../../../../core/utils/fechas';
import { mensajeError } from '../../../../core/utils/mensaje-error';
import {
  LARGO_MINIMO_PASSWORD,
  obligatorioSinEspacios,
  PATRON_EMAIL,
} from '../../../../core/utils/validadores';
import { Cargando } from '../../../../shared/cargando/cargando';

/** Largo máximo de nombre, apellido y email (columnas de la tabla `usuario`). */
const LARGO_MAXIMO_TEXTO = 30;
const PATRON_DNI = /^\d{7,8}$/;
const PATRON_TELEFONO = /^\d{6,10}$/;

/** Sin `id` es un alta; con `id`, la edición de ese usuario. */
export interface DatosFormularioUsuario {
  id?: number;
}

/**
 * Diálogo de alta (operador, médico o administrador) y de edición de cualquier usuario.
 * Los campos de sede, especialidades y cobertura aparecen según el rol. Se cierra
 * con `true` si se guardó; si el backend rechaza los datos, muestra el mensaje y sigue abierto.
 */
@Component({
  selector: 'app-formulario-usuario',
  imports: [
    Cargando,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    ReactiveFormsModule,
  ],
  templateUrl: './formulario-usuario.html',
  styleUrl: './formulario-usuario.scss',
})
export class FormularioUsuario {
  private readonly dialogRef = inject(MatDialogRef<FormularioUsuario, boolean>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly usuarioService = inject(UsuarioService);
  private readonly sedeService = inject(SedeService);
  private readonly especialidadService = inject(EspecialidadService);
  private readonly coberturaService = inject(CoberturaService);
  private readonly id = inject<DatosFormularioUsuario>(MAT_DIALOG_DATA).id;

  protected readonly esEdicion = this.id !== undefined;
  protected readonly rolesAlta = ROLES_ALTA;
  protected readonly etiquetasRol: Record<string, string> = ETIQUETAS_ROL;
  protected readonly largoMaximoTexto = LARGO_MAXIMO_TEXTO;
  protected readonly largoMinimoPassword = LARGO_MINIMO_PASSWORD;
  protected readonly hoy = new Date();

  protected readonly form = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [obligatorioSinEspacios, Validators.maxLength(LARGO_MAXIMO_TEXTO)],
    }),
    apellido: new FormControl('', {
      nonNullable: true,
      validators: [obligatorioSinEspacios, Validators.maxLength(LARGO_MAXIMO_TEXTO)],
    }),
    dni: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PATRON_DNI)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(PATRON_EMAIL),
        Validators.maxLength(LARGO_MAXIMO_TEXTO),
      ],
    }),
    telefono: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(PATRON_TELEFONO)],
    }),
    fechaNacimiento: new FormControl<Date | null>(null, Validators.required),
    // En la edición es opcional: si queda vacía, la contraseña no cambia.
    password: new FormControl('', {
      nonNullable: true,
      validators: this.esEdicion
        ? [Validators.minLength(LARGO_MINIMO_PASSWORD)]
        : [Validators.required, Validators.minLength(LARGO_MINIMO_PASSWORD)],
    }),
    rol: new FormControl<Rol | null>(null, Validators.required),
    idSede: new FormControl<number | null>({ value: null, disabled: true }, Validators.required),
    especialidades: new FormControl<number[]>(
      { value: [], disabled: true },
      { nonNullable: true, validators: Validators.required },
    ),
    idCobertura: new FormControl<number | null>(
      { value: null, disabled: true },
      Validators.required,
    ),
  });

  protected readonly rol = signal<Rol | null>(null);
  protected readonly llevaSede = computed(
    () => this.rol() === 'operador' || this.rol() === 'medico',
  );
  protected readonly llevaEspecialidades = computed(() => this.rol() === 'medico');
  protected readonly llevaCobertura = computed(() => this.rol() === 'paciente');

  protected readonly sedes = signal<Sede[]>([]);
  protected readonly especialidades = signal<Especialidad[]>([]);
  protected readonly coberturas = signal<Cobertura[]>([]);

  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly errorEnvio = signal<string | null>(null);
  protected readonly ocultarPassword = signal(true);

  constructor() {
    this.form.controls.rol.valueChanges.pipe(takeUntilDestroyed()).subscribe((rol) => {
      this.rol.set(rol);
      this.aplicarReglasDelRol(rol);
    });
    // El rol de un usuario existente no se puede cambiar.
    if (this.esEdicion) {
      this.form.controls.rol.disable();
    }
    this.cargar();
  }

  /** Trae los listados para elegir y, en la edición, los datos del usuario. */
  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);
    const usuario: Observable<UsuarioDetalle | null> =
      this.id === undefined ? of(null) : this.usuarioService.obtener(this.id);

    forkJoin({
      sedes: this.sedeService.listar(),
      especialidades: this.especialidadService.listar(),
      coberturas: this.coberturaService.listar(),
      usuario,
    })
      .pipe(
        finalize(() => this.cargando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ sedes, especialidades, coberturas, usuario }) => {
          this.sedes.set(sedes);
          this.especialidades.set(especialidades);
          this.coberturas.set(coberturas);
          if (usuario) {
            this.precargar(usuario);
          }
        },
        error: (error: unknown) =>
          this.errorCarga.set(
            mensajeError(error, 'No se pudieron cargar los datos del formulario.'),
          ),
      });
  }

  protected guardar(): void {
    this.errorEnvio.set(null);
    const rol = this.rol();
    if (this.form.invalid || !rol) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const datos = {
      nombre: valores.nombre.trim(),
      apellido: valores.apellido.trim(),
      dni: valores.dni,
      email: valores.email.trim(),
      telefono: valores.telefono,
      fecha_nacimiento: fechaIso(valores.fechaNacimiento!),
      ...(this.llevaSede() ? { id_sede: valores.idSede! } : {}),
      ...(this.llevaEspecialidades() ? { especialidades: valores.especialidades } : {}),
    };

    const pedido =
      this.id === undefined
        ? this.usuarioService.crear({ ...datos, rol: rol as RolAlta, password: valores.password })
        : this.usuarioService.actualizar(this.id, {
            ...datos,
            ...(valores.password ? { password: valores.password } : {}),
            ...(this.llevaCobertura() ? { id_cobertura: valores.idCobertura! } : {}),
          });

    this.guardando.set(true);
    pedido
      .pipe(
        finalize(() => this.guardando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: (error: unknown) =>
          this.errorEnvio.set(mensajeError(error, 'No se pudieron guardar los datos.')),
      });
  }

  private precargar(usuario: UsuarioDetalle): void {
    this.form.controls.rol.setValue(usuario.rol);
    this.form.patchValue({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      dni: usuario.dni,
      email: usuario.email,
      telefono: usuario.telefono ?? '',
      fechaNacimiento: parsearFecha(usuario.fecha_nacimiento),
      idSede: usuario.id_sede,
      especialidades: usuario.especialidades.map((especialidad) => especialidad.id),
      idCobertura: usuario.id_cobertura,
    });
  }

  /** Habilita y valida solo los campos que corresponden al rol; el resto se vacía. */
  private aplicarReglasDelRol(rol: Rol | null): void {
    const { idSede, especialidades, idCobertura } = this.form.controls;
    this.habilitarSi(idSede, rol === 'operador' || rol === 'medico');
    this.habilitarSi(especialidades, rol === 'medico');
    this.habilitarSi(idCobertura, rol === 'paciente');
  }

  private habilitarSi(control: AbstractControl, habilitado: boolean): void {
    if (habilitado) {
      control.enable({ emitEvent: false });
    } else {
      control.reset(undefined, { emitEvent: false });
      control.disable({ emitEvent: false });
    }
  }
}
