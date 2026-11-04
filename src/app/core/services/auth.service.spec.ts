import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../environments/environment';
import { Usuario } from '../models';
import { AuthService } from './auth.service';

const PACIENTE: Usuario = {
  id: 7,
  nombre: 'Ana',
  apellido: 'Pérez',
  dni: '30111222',
  email: 'ana@mail.com',
  telefono: '1155556666',
  fecha_nacimiento: '1990-05-17',
  rol: 'paciente',
  id_sede: null,
  id_cobertura: 2,
};

describe('AuthService', () => {
  let servicio: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    servicio = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  describe('actualizarPerfil', () => {
    it('envía solo los cambios y actualiza el usuario actual', () => {
      let resultado: Usuario | undefined;
      servicio
        .actualizarPerfil({ telefono: '1144443333' })
        .subscribe((usuario) => (resultado = usuario));

      const pedido = http.expectOne(`${environment.apiUrl}/auth/perfil`);
      expect(pedido.request.method).toBe('PATCH');
      expect(pedido.request.body).toEqual({ telefono: '1144443333' });

      const actualizado = { ...PACIENTE, telefono: '1144443333' };
      pedido.flush({ codigo: 200, estado: 'ok', mensaje: null, datos: actualizado });

      expect(resultado).toEqual(actualizado);
      expect(servicio.usuario()).toEqual(actualizado);
    });

    it('si el backend rechaza los cambios, no toca el usuario actual', () => {
      let error: unknown;
      servicio
        .actualizarPerfil({ email: 'otro@mail.com' })
        .subscribe({ error: (e) => (error = e) });

      http
        .expectOne(`${environment.apiUrl}/auth/perfil`)
        .flush(
          { codigo: 409, estado: 'error', mensaje: 'El email ya está en uso', datos: null },
          { status: 409, statusText: 'Conflict' },
        );

      expect(error).toBeDefined();
      expect(servicio.usuario()).toBeNull();
    });
  });
});
