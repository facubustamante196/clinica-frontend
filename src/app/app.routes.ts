import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Rol } from './core/models';

export const routes: Routes = [
  // Públicas
  {
    path: '',
    pathMatch: 'full',
    title: 'Inicio',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'login',
    title: 'Iniciar sesión',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    title: 'Registro',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.Registro),
  },

  // Con sesión
  {
    path: 'perfil',
    title: 'Mi perfil',
    canMatch: [authGuard],
    loadComponent: () => import('./pages/perfil/perfil').then((m) => m.Perfil),
  },

  // Secciones por rol
  {
    path: 'admin',
    canMatch: [authGuard, roleGuard],
    data: { roles: ['admin'] satisfies Rol[] },
    loadChildren: () => import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'medico',
    canMatch: [authGuard, roleGuard],
    data: { roles: ['medico'] satisfies Rol[] },
    loadChildren: () => import('./pages/medico/medico.routes').then((m) => m.MEDICO_ROUTES),
  },
  {
    path: 'operador',
    canMatch: [authGuard, roleGuard],
    data: { roles: ['operador'] satisfies Rol[] },
    loadChildren: () => import('./pages/operador/operador.routes').then((m) => m.OPERADOR_ROUTES),
  },
  {
    path: 'paciente',
    canMatch: [authGuard, roleGuard],
    data: { roles: ['paciente'] satisfies Rol[] },
    loadChildren: () => import('./pages/paciente/paciente.routes').then((m) => m.PACIENTE_ROUTES),
  },

  // Estados
  {
    path: 'acceso-denegado',
    title: 'Acceso denegado',
    loadComponent: () =>
      import('./pages/acceso-denegado/acceso-denegado').then((m) => m.AccesoDenegado),
  },
  {
    path: '**',
    title: 'Página no encontrada',
    loadComponent: () => import('./pages/no-encontrada/no-encontrada').then((m) => m.NoEncontrada),
  },
];
