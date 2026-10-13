import { HttpContextToken } from '@angular/common/http';

/**
 * Marca una petición cuyo 401 lo maneja quien la hace (por ejemplo, credenciales
 * inválidas en el login), en lugar de cerrar la sesión y mandar al login.
 */
export const OMITIR_MANEJO_401 = new HttpContextToken<boolean>(() => false);
