import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, MatCardModule, MatIconModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  protected readonly auth = inject(AuthService);

  protected readonly beneficios = [
    { icono: 'event_available', texto: 'Sacar y cancelar turnos desde cualquier lugar.' },
    { icono: 'folder_shared', texto: 'Consultar tu historial clínico cuando lo necesites.' },
    { icono: 'notifications_active', texto: 'Recibir avisos sobre tus turnos.' },
  ];
}
