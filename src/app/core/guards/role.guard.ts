import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { Rol } from '../models';
import { AuthService } from '../services/auth.service';

/**
 * Deja pasar solo a los roles indicados en `data.roles` de la ruta.
 * Sin sesión redirige a /login; con otro rol, a /acceso-denegado.
 */
export const roleGuard: CanMatchFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rol = auth.rol();

  if (!rol) {
    return router.createUrlTree(['/login']);
  }

  const permitidos = (route.data?.['roles'] ?? []) as Rol[];
  return permitidos.includes(rol) || router.createUrlTree(['/acceso-denegado']);
};
