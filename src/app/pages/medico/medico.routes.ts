import { Routes } from '@angular/router';

export const MEDICO_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'agenda' },
  {
    path: 'agenda',
    title: 'Mi agenda',
    loadComponent: () => import('./agenda/agenda-medico').then((m) => m.AgendaMedico),
  },
  {
    path: 'turnos',
    title: 'Turnos',
    loadComponent: () => import('./turnos/turnos-medico').then((m) => m.TurnosMedico),
  },
  {
    path: 'historial',
    title: 'Historial clínico',
    loadComponent: () => import('./historial/historial-medico').then((m) => m.HistorialMedico),
  },
];
