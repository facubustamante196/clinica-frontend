import { LowerCasePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';

import {
  ENTIDADES_AUDITORIA,
  EntidadAuditoria,
  FiltrosAuditoria,
  RegistroAuditoria,
} from '../../../core/models';
import { AuditoriaService } from '../../../core/services/auditoria.service';
import { fechaIso } from '../../../core/utils/fechas';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { BarraCarga } from '../../../shared/barra-carga/barra-carga';
import { Cargando } from '../../../shared/cargando/cargando';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';

const ETIQUETAS_ENTIDAD: Record<EntidadAuditoria, string> = {
  usuario: 'Usuario',
  cobertura: 'Cobertura',
  especialidad: 'Especialidad',
  sede: 'Sede',
};

/** El backend exige `desde` y `hasta` juntos: o se completan los dos o ninguno. */
function rangoCompleto(grupo: AbstractControl): ValidationErrors | null {
  const { desde, hasta } = grupo.value as { desde: Date | null; hasta: Date | null };
  return Boolean(desde) === Boolean(hasta) ? null : { rangoIncompleto: true };
}

@Component({
  selector: 'app-auditoria',
  imports: [
    BarraCarga,
    Cargando,
    FechaPipe,
    LowerCasePipe,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    ReactiveFormsModule,
    SinResultados,
  ],
  templateUrl: './auditoria.html',
  styleUrl: './auditoria.scss',
})
export class Auditoria implements OnInit {
  private readonly auditoriaService = inject(AuditoriaService);

  protected readonly entidades = ENTIDADES_AUDITORIA;
  protected readonly etiquetasEntidad: Record<string, string> = ETIQUETAS_ENTIDAD;
  protected readonly columnas = ['fecha', 'usuario', 'accion', 'entidad', 'detalle'];
  protected readonly tamaniosPagina = [10, 25, 50];

  protected readonly filtros = new FormGroup({
    idUsuario: new FormControl<number | null>(null, [Validators.min(1), Validators.pattern(/^\d+$/)]),
    entidad: new FormControl<EntidadAuditoria | null>(null),
    rango: new FormGroup(
      {
        desde: new FormControl<Date | null>(null),
        hasta: new FormControl<Date | null>(null),
      },
      { validators: rangoCompleto },
    ),
  });

  private readonly registros = signal<RegistroAuditoria[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly pagina = signal(0);
  protected readonly tamanioPagina = signal(10);

  protected readonly total = computed(() => this.registros().length);
  protected readonly paginaActual = computed(() => {
    const inicio = this.pagina() * this.tamanioPagina();
    return this.registros().slice(inicio, inicio + this.tamanioPagina());
  });

  ngOnInit(): void {
    this.buscar();
  }

  protected buscar(): void {
    if (this.filtros.invalid) {
      this.filtros.markAllAsTouched();
      return;
    }

    const { idUsuario, entidad, rango } = this.filtros.getRawValue();
    const filtros: FiltrosAuditoria = {
      id_usuario: idUsuario ?? undefined,
      entidad: entidad ?? undefined,
      desde: rango.desde ? fechaIso(rango.desde) : undefined,
      hasta: rango.hasta ? fechaIso(rango.hasta) : undefined,
    };

    this.cargando.set(true);
    this.error.set(null);
    this.auditoriaService
      .listar(filtros)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (registros) => {
          this.registros.set(registros);
          this.pagina.set(0);
        },
        error: (error: unknown) => {
          this.registros.set([]);
          this.error.set(mensajeError(error, 'No se pudo cargar la auditoría.'));
        },
      });
  }

  protected limpiar(): void {
    this.filtros.reset();
    this.buscar();
  }

  protected cambiarPagina(evento: PageEvent): void {
    this.pagina.set(evento.pageIndex);
    this.tamanioPagina.set(evento.pageSize);
  }
}
