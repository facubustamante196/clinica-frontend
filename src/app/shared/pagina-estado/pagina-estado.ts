import { Component, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

/** Tarjeta para páginas de estado (no encontrada, acceso denegado, en construcción). */
@Component({
  selector: 'app-pagina-estado',
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './pagina-estado.html',
  styleUrl: './pagina-estado.scss',
})
export class PaginaEstado {
  readonly icono = input.required<string>();
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
}
