import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';

import { Cobertura, ETIQUETAS_ROL, Sede } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CoberturaService } from '../../core/services/cobertura.service';
import { SedeService } from '../../core/services/sede.service';
import { FechaPipe } from '../../shared/pipes/fecha.pipe';

@Component({
  selector: 'app-perfil',
  imports: [FechaPipe, MatCardModule, MatIconModule, MatListModule, MatProgressSpinnerModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil {
  private readonly auth = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly usuario = this.auth.usuario;
  protected readonly cargando = signal(true);
  private readonly coberturas = signal<Cobertura[]>([]);
  private readonly sedes = signal<Sede[]>([]);

  protected readonly etiquetaRol = computed(() => {
    const rol = this.auth.rol();
    return rol ? ETIQUETAS_ROL[rol] : '';
  });

  protected readonly cobertura = computed(() => {
    const id = this.usuario()?.id_cobertura;
    return this.coberturas().find((c) => c.id === id)?.nombre ?? null;
  });

  protected readonly sede = computed(() => {
    const id = this.usuario()?.id_sede;
    return this.sedes().find((s) => s.id === id)?.nombre ?? null;
  });

  constructor() {
    this.auth
      .obtenerPerfil()
      .pipe(
        takeUntilDestroyed(),
        finalize(() => this.cargando.set(false)),
      )
      .subscribe({
        error: () =>
          this.snackBar.open('No se pudo cargar el perfil.', 'Cerrar', { duration: 5000 }),
      });

    inject(CoberturaService)
      .listar()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (coberturas) => this.coberturas.set(coberturas), error: () => {} });

    inject(SedeService)
      .listar()
      .pipe(takeUntilDestroyed())
      .subscribe({ next: (sedes) => this.sedes.set(sedes), error: () => {} });
  }
}
