import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { catchError, debounceTime, filter, of, Subject, switchMap, tap } from 'rxjs';

import {
  ETIQUETAS_ROL,
  FiltrosUsuarios,
  Rol,
  ROLES,
  Sede,
  UsuarioListado,
} from '../../../core/models';
import { SedeService } from '../../../core/services/sede.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { BarraCarga } from '../../../shared/barra-carga/barra-carga';
import { Cargando } from '../../../shared/cargando/cargando';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';
import { DatosFormularioUsuario, FormularioUsuario } from './formulario-usuario/formulario-usuario';

/** Espera antes de buscar mientras el usuario escribe en los filtros. */
const ESPERA_FILTRO_MS = 400;
const LARGO_MAXIMO_TEXTO = 30;

@Component({
  selector: 'app-usuarios',
  imports: [
    BarraCarga,
    Cargando,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    ReactiveFormsModule,
    SinResultados,
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios {
  private readonly usuarioService = inject(UsuarioService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly roles = ROLES;
  protected readonly etiquetasRol: Record<string, string> = ETIQUETAS_ROL;
  protected readonly columnas = ['nombre', 'dni', 'email', 'rol', 'sede', 'acciones'];
  protected readonly tamaniosPagina = [10, 25, 50];
  protected readonly largoMaximoTexto = LARGO_MAXIMO_TEXTO;

  protected readonly filtros = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(LARGO_MAXIMO_TEXTO),
    }),
    apellido: new FormControl('', {
      nonNullable: true,
      validators: Validators.maxLength(LARGO_MAXIMO_TEXTO),
    }),
    rol: new FormControl<Rol | null>(null),
    idSede: new FormControl<number | null>(null),
  });

  protected readonly sedes = signal<Sede[]>([]);
  protected readonly usuarios = signal<UsuarioListado[]>([]);
  protected readonly total = signal(0);
  /** Índice de página del paginador (empieza en 0; la API empieza en 1). */
  protected readonly pagina = signal(0);
  protected readonly tamanioPagina = signal(10);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);

  /** Cada emisión pide la página actual; `switchMap` descarta las respuestas viejas. */
  private readonly pedidos = new Subject<void>();

  constructor() {
    this.pedidos
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.usuarioService
            .listar(this.filtrosActuales(), this.pagina() + 1, this.tamanioPagina())
            .pipe(
              catchError((error: unknown) => {
                this.error.set(mensajeError(error, 'No se pudo cargar el listado de usuarios.'));
                return of(null);
              }),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((resultado) => {
        this.usuarios.set(resultado?.items ?? []);
        this.total.set(resultado?.total ?? 0);
        this.cargando.set(false);
      });

    this.filtros.valueChanges
      .pipe(debounceTime(ESPERA_FILTRO_MS), takeUntilDestroyed())
      .subscribe(() => {
        if (this.filtros.valid) {
          this.pagina.set(0);
          this.cargar();
        }
      });

    inject(SedeService)
      .listar()
      .pipe(takeUntilDestroyed())
      // Si falla, el filtro de sede queda vacío; el interceptor ya avisó al usuario.
      .subscribe({ next: (sedes) => this.sedes.set(sedes), error: () => undefined });

    this.cargar();
  }

  protected cargar(): void {
    this.pedidos.next();
  }

  protected limpiar(): void {
    this.filtros.reset();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.tamanioPagina.set(evento.pageSize);
    this.cargar();
  }

  /** Abre el formulario de alta (sin usuario) o de edición, y refresca el listado si se guardó. */
  protected abrirFormulario(usuario?: UsuarioListado): void {
    this.dialog
      .open<FormularioUsuario, DatosFormularioUsuario, boolean>(FormularioUsuario, {
        data: { id: usuario?.id },
        width: '640px',
      })
      .afterClosed()
      .pipe(filter((guardado) => guardado === true))
      .subscribe(() => {
        this.snackBar.open(usuario ? 'Cambios guardados.' : 'Usuario creado.', 'Cerrar', {
          duration: 4000,
        });
        this.cargar();
      });
  }

  private filtrosActuales(): FiltrosUsuarios {
    const { nombre, apellido, rol, idSede } = this.filtros.getRawValue();
    return {
      nombre,
      apellido,
      rol: rol ?? undefined,
      id_sede: idSede ?? undefined,
    };
  }
}
