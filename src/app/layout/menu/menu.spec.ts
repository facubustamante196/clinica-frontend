import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Rol, Usuario } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { Menu } from './menu';

describe('Menu', () => {
  const usuario = signal<Usuario | null>(null);
  let fixture: ComponentFixture<Menu>;

  const entrar = (rol: Rol | null) => {
    usuario.set(rol ? ({ nombre: 'Ana', apellido: 'Pérez', rol } as Usuario) : null);
    fixture.detectChanges();
  };

  const etiquetas = (): string[] =>
    Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('a')).map((a) =>
      a.textContent!.replace(/\s+/g, ' ').trim(),
    );

  beforeEach(async () => {
    usuario.set(null);
    await TestBed.configureTestingModule({
      imports: [Menu],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            rol: computed(() => usuario()?.rol ?? null),
            estaLogueado: computed(() => usuario() !== null),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Menu);
  });

  it('sin sesión ofrece iniciar sesión y registrarse', () => {
    entrar(null);

    const opciones = etiquetas().join('|');
    expect(opciones).toContain('Iniciar sesión');
    expect(opciones).toContain('Registrarse');
    expect(opciones).not.toContain('Mi perfil');
  });

  it('paciente ve sus opciones y no las de otros roles', () => {
    entrar('paciente');

    const opciones = etiquetas().join('|');
    expect(opciones).toContain('Mis turnos');
    expect(opciones).toContain('Mi perfil');
    expect(opciones).not.toContain('Coberturas');
    expect(opciones).not.toContain('Registrarse');
  });

  it('admin ve la administración', () => {
    entrar('admin');

    const opciones = etiquetas().join('|');
    expect(opciones).toContain('Coberturas');
    expect(opciones).toContain('Auditoría');
    expect(opciones).not.toContain('Mis turnos');
  });

  it('medico y operador ven sus secciones', () => {
    entrar('medico');
    expect(etiquetas().join('|')).toContain('Mi agenda');

    entrar('operador');
    expect(etiquetas().join('|')).toContain('Agendas');
  });
});
