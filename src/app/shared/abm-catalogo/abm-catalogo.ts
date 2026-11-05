import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter, finalize, switchMap } from 'rxjs';

import { mensajeError } from '../../core/utils/mensaje-error';
import { Cargando } from '../cargando/cargando';
import { confirmar } from '../dialogo-confirmacion/dialogo-confirmacion';
import { SinResultados } from '../sin-resultados/sin-resultados';
import { ConfigCatalogo } from './abm-catalogo.config';
import { DatosFormularioCatalogo, FormularioCatalogo } from './formulario-catalogo';

/**
 * Pantalla de ABM para entidades simples: tabla con filtro de texto, alta y
 * modificación en un diálogo, y baja con confirmación. Después de cada cambio
 * vuelve a pedir el listado; si el backend rechaza algo, muestra su mensaje.
 */
@Component({
  selector: 'app-abm-catalogo',
  imports: [
    Cargando,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    MatTooltipModule,
    SinResultados,
  ],
  templateUrl: './abm-catalogo.html',
  styleUrl: './abm-catalogo.scss',
})
export class AbmCatalogo<T extends { id: number }> implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly config = input.required<ConfigCatalogo<T>>();

  protected readonly items = signal<T[]>([]);
  protected readonly cargando = signal(true);
  protected readonly errorCarga = signal(false);
  protected readonly filtro = signal('');

  protected readonly columnas = computed(() => [
    ...this.config().campos.map((campo) => campo.nombre),
    'acciones',
  ]);

  protected readonly filtrados = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    if (!texto) {
      return this.items();
    }
    return this.items().filter((item) =>
      this.config().campos.some((campo) =>
        String(item[campo.nombre]).toLowerCase().includes(texto),
      ),
    );
  });

  ngOnInit(): void {
    this.cargar();
  }

  /** Texto del primer campo del registro, para los nombres accesibles de sus botones. */
  protected nombreItem(item: T): string {
    const primero = this.config().campos[0];
    return primero ? String(item[primero.nombre]) : '';
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(false);
    this.config()
      .listar()
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (items) => this.items.set(items),
        error: () => this.errorCarga.set(true),
      });
  }

  protected alFiltrar(evento: Event): void {
    this.filtro.set((evento.target as HTMLInputElement).value);
  }

  protected abrirFormulario(item?: T): void {
    const config = this.config();
    const datos: DatosFormularioCatalogo = {
      titulo: item ? config.tituloEdicion : config.tituloAlta,
      campos: config.campos as unknown as DatosFormularioCatalogo['campos'],
      valores: item as Record<string, unknown> | undefined,
      guardar: (valores) => {
        const cuerpo = valores as unknown as Omit<T, 'id'>;
        return item ? config.modificar(item.id, cuerpo) : config.crear(cuerpo);
      },
    };

    this.dialog
      .open<FormularioCatalogo, DatosFormularioCatalogo, boolean>(FormularioCatalogo, {
        data: datos,
        width: '480px',
      })
      .afterClosed()
      .pipe(filter((guardado) => guardado === true))
      .subscribe(() => {
        this.snackBar.open(item ? 'Cambios guardados.' : 'Alta registrada.', 'Cerrar', {
          duration: 4000,
        });
        this.cargar();
      });
  }

  protected eliminar(item: T): void {
    const config = this.config();
    confirmar(this.dialog, {
      titulo: 'Confirmar baja',
      mensaje: `¿Está seguro de eliminar ${config.describir(item)}?`,
      textoConfirmar: 'Eliminar',
    })
      .pipe(
        filter(Boolean),
        switchMap(() => config.eliminar(item.id)),
      )
      .subscribe({
        next: () => {
          this.snackBar.open('Baja registrada.', 'Cerrar', { duration: 4000 });
          this.cargar();
        },
        // Ej: "No se puede eliminar la sede: tiene agenda asociada". El listado no cambia.
        error: (error: unknown) =>
          this.snackBar.open(mensajeError(error), 'Cerrar', { duration: 8000 }),
      });
  }
}
