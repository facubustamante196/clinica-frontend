import { Routes } from '@angular/router';

const enConstruccion = () =>
  import('../en-construccion/en-construccion').then((m) => m.EnConstruccion);

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'coberturas' },
  {
    path: 'coberturas',
    title: 'Coberturas',
    loadComponent: enConstruccion,
    data: { funcion: 'Coberturas' },
  },
  { path: 'sedes', title: 'Sedes', loadComponent: enConstruccion, data: { funcion: 'Sedes' } },
  {
    path: 'especialidades',
    title: 'Especialidades',
    loadComponent: enConstruccion,
    data: { funcion: 'Especialidades' },
  },
  {
    path: 'reportes',
    title: 'Reportes',
    loadComponent: enConstruccion,
    data: { funcion: 'Reportes' },
  },
  {
    path: 'auditoria',
    title: 'Auditoría',
    loadComponent: enConstruccion,
    data: { funcion: 'Auditoría' },
  },
];
