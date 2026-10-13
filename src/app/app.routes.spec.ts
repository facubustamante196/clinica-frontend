import { provideHttpClient } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';
import { Rol } from './core/models';
import { AuthService } from './core/services/auth.service';

describe('Rutas', () => {
  const rol = signal<Rol | null>(null);

  async function navegar(url: string): Promise<string> {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return TestBed.inject(Router).url;
  }

  beforeEach(() => {
    rol.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        {
          provide: AuthService,
          useValue: {
            rol,
            estaLogueado: computed(() => rol() !== null),
            usuario: signal(null),
          },
        },
      ],
    });
  });

  it('sin sesión, /perfil redirige a /login', async () => {
    expect(await navegar('/perfil')).toBe('/login');
  });

  it('sin sesión, una sección de rol redirige a /login', async () => {
    expect(await navegar('/admin/sedes')).toBe('/login');
  });

  it('con otro rol, redirige a /acceso-denegado', async () => {
    rol.set('paciente');
    expect(await navegar('/admin/sedes')).toBe('/acceso-denegado');
  });

  it('con el rol correcto, entra a la sección', async () => {
    rol.set('medico');
    expect(await navegar('/medico')).toBe('/medico/agenda');
  });

  it('una ruta inexistente muestra "No encontrada" sin redirigir', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/no-existe');
    expect(harness.routeNativeElement?.textContent).toContain('Página no encontrada');
  });
});
