import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/** Deja pasar solo con sesión iniciada; si no, redirige a /login. */
export const authGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  return auth.estaLogueado() || inject(Router).createUrlTree(['/login']);
};
