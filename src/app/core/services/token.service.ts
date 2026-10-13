import { Injectable } from '@angular/core';

const CLAVE_TOKEN = 'clinica_token';

/** Persistencia del JWT en localStorage. */
@Injectable({ providedIn: 'root' })
export class TokenService {
  obtener(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  guardar(token: string): void {
    localStorage.setItem(CLAVE_TOKEN, token);
  }

  borrar(): void {
    localStorage.removeItem(CLAVE_TOKEN);
  }
}
