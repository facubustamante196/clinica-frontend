import { Routes } from '@angular/router';

const enConstruccion = () =>
  import('../en-construccion/en-construccion').then((m) => m.EnConstruccion);

export const MEDICO_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'agenda' },
  {
    path: 'agenda',
    title: 'Mi agenda',
    loadComponent: enConstruccion,
    data: { funcion: 'Mi agenda' },
  },
  { path: 'turnos', title: 'Turnos', loadComponent: enConstruccion, data: { funcion: 'Turnos' } },
  {
    path: 'historial',
    title: 'Historial clínico',
    loadComponent: enConstruccion,
    data: { funcion: 'Historial clínico' },
  },
];
