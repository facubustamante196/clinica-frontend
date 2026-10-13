import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Inicio',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'registro',
    title: 'Registro',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },
];
