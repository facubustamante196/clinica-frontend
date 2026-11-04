import { Routes } from '@angular/router';

export const OPERADOR_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'agendas' },
  {
    path: 'agendas',
    title: 'Agendas',
    loadComponent: () => import('./agendas/agendas-operador').then((m) => m.AgendasOperador),
  },
  {
    path: 'pacientes',
    title: 'Alta de pacientes',
    loadComponent: () => import('./pacientes/alta-paciente').then((m) => m.AltaPaciente),
  },
  {
    path: 'turnos',
    title: 'Asignar turno',
    loadComponent: () => import('./turnos/asignar-turno').then((m) => m.AsignarTurno),
  },
];
