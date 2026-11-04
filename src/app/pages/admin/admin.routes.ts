import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'coberturas' },
  {
    path: 'coberturas',
    title: 'Coberturas',
    loadComponent: () => import('./coberturas/coberturas').then((m) => m.Coberturas),
  },
  {
    path: 'sedes',
    title: 'Sedes',
    loadComponent: () => import('./sedes/sedes').then((m) => m.Sedes),
  },
  {
    path: 'especialidades',
    title: 'Especialidades',
    loadComponent: () =>
      import('./especialidades/especialidades').then((m) => m.Especialidades),
  },
  {
    path: 'usuarios',
    title: 'Usuarios',
    loadComponent: () => import('./usuarios/usuarios').then((m) => m.Usuarios),
  },
  {
    path: 'reportes',
    title: 'Reportes',
    loadComponent: () => import('./reportes/reportes').then((m) => m.Reportes),
  },
  {
    path: 'auditoria',
    title: 'Auditoría',
    loadComponent: () => import('./auditoria/auditoria').then((m) => m.Auditoria),
  },
];
