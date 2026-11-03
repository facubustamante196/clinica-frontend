import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { finalize } from 'rxjs';

import { Reportes as DatosReportes } from '../../../core/models';
import { ReporteService } from '../../../core/services/reporte.service';
import { fechaIso } from '../../../core/utils/fechas';
import { mensajeError } from '../../../core/utils/mensaje-error';
import { Cargando } from '../../../shared/cargando/cargando';
import { FechaPipe } from '../../../shared/pipes/fecha.pipe';
import { SinResultados } from '../../../shared/sin-resultados/sin-resultados';

const COLORES = ['#00838f', '#1e88e5', '#8e24aa', '#f4511e', '#7cb342', '#fdd835', '#6d4c41'];

@Component({
  selector: 'app-reportes',
  imports: [
    BaseChartDirective,
    Cargando,
    DecimalPipe,
    FechaPipe,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTableModule,
    ReactiveFormsModule,
    SinResultados,
  ],
  // Chart.js se registra solo acá, así no pesa en el resto de la aplicación.
  providers: [provideCharts(withDefaultRegisterables())],
  templateUrl: './reportes.html',
  styleUrl: './reportes.scss',
})
export class Reportes implements OnInit {
  private readonly reporteService = inject(ReporteService);

  protected readonly columnasRanking = ['posicion', 'medico', 'cantidad'];

  protected readonly rango = new FormGroup({
    desde: new FormControl<Date | null>(this.inicioDeMes(), [Validators.required]),
    hasta: new FormControl<Date | null>(new Date(), [Validators.required]),
  });

  protected readonly datos = signal<DatosReportes | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly opcionesBarras: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
  };

  protected readonly opcionesTorta: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' } },
  };

  protected readonly graficoEspecialidades = computed<ChartData<'bar'>>(() => {
    const items = this.datos()?.porEspecialidad.items ?? [];
    return {
      labels: items.map((item) => item.descripcion),
      datasets: [
        { label: 'Turnos', data: items.map((item) => item.cantidad), backgroundColor: COLORES[0] },
      ],
    };
  });

  protected readonly graficoSedes = computed<ChartData<'pie'>>(() => {
    const items = this.datos()?.porSede.items ?? [];
    return {
      labels: items.map((item) => item.nombre),
      datasets: [{ data: items.map((item) => item.cantidad), backgroundColor: COLORES }],
    };
  });

  protected readonly hayTurnosPorEspecialidad = computed(() =>
    (this.datos()?.porEspecialidad.items ?? []).some((item) => item.cantidad > 0),
  );

  protected readonly hayTurnosPorSede = computed(() =>
    (this.datos()?.porSede.items ?? []).some((item) => item.cantidad > 0),
  );

  ngOnInit(): void {
    this.actualizar();
  }

  /** Vuelve a pedir los cuatro indicadores con el rango elegido. */
  protected actualizar(): void {
    if (this.rango.invalid) {
      this.rango.markAllAsTouched();
      return;
    }
    const { desde, hasta } = this.rango.getRawValue();

    this.cargando.set(true);
    this.error.set(null);
    this.reporteService
      .obtenerTodos({ desde: fechaIso(desde!), hasta: fechaIso(hasta!) })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: (datos) => this.datos.set(datos),
        error: (error: unknown) => {
          this.datos.set(null);
          this.error.set(mensajeError(error, 'No se pudieron cargar los reportes.'));
        },
      });
  }

  private inicioDeMes(): Date {
    const hoy = new Date();
    return new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  }
}
