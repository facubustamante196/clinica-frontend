import { Routes } from '@angular/router';

const enConstruccion = () =>
  import('../en-construccion/en-construccion').then((m) => m.EnConstruccion);

export const OPERADOR_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'agendas' },
  {
    path: 'agendas',
    title: 'Agendas',
    loadComponent: enConstruccion,
    data: { funcion: 'Agendas' },
  },
  { path: 'turnos', title: 'Turnos', loadComponent: enConstruccion, data: { funcion: 'Turnos' } },
];
