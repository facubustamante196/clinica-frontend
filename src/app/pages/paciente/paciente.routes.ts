import { Routes } from '@angular/router';

const enConstruccion = () =>
  import('../en-construccion/en-construccion').then((m) => m.EnConstruccion);

export const PACIENTE_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'turnos' },
  {
    path: 'turnos',
    title: 'Mis turnos',
    loadComponent: enConstruccion,
    data: { funcion: 'Mis turnos' },
  },
  {
    path: 'historial',
    title: 'Mi historial clínico',
    loadComponent: enConstruccion,
    data: { funcion: 'Mi historial clínico' },
  },
  {
    path: 'notificaciones',
    title: 'Notificaciones',
    loadComponent: enConstruccion,
    data: { funcion: 'Notificaciones' },
  },
];
