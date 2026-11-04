import { Routes } from '@angular/router';

export const PACIENTE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'turnos' },
  {
    path: 'turnos',
    title: 'Mis turnos',
    loadComponent: () => import('./mis-turnos/mis-turnos').then((m) => m.MisTurnos),
  },
  {
    path: 'datos',
    title: 'Mis datos',
    loadComponent: () => import('./mis-datos/mis-datos').then((m) => m.MisDatos),
  },
];
