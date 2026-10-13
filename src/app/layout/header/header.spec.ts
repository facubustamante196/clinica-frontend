import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { Usuario } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { Header } from './header';

describe('Header', () => {
  const usuario = signal<Usuario | null>(null);
  const logout = vi.fn();
  let fixture: ComponentFixture<Header>;

  const texto = (): string => fixture.nativeElement.textContent.replace(/\s+/g, ' ');

  beforeEach(async () => {
    usuario.set(null);
    logout.mockClear();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            usuario: usuario.asReadonly(),
            rol: computed(() => usuario()?.rol ?? null),
            estaLogueado: computed(() => usuario() !== null),
            logout,
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
  });

  it('sin sesión muestra el saludo de bienvenida', () => {
    expect(texto()).toContain('Bienvenido a la clínica virtual');
    expect(texto()).not.toContain('Cerrar sesión');
  });

  it('con sesión muestra nombre, tipo de usuario y permite cerrar sesión', () => {
    usuario.set({ nombre: 'Ana', apellido: 'Pérez', rol: 'medico' } as Usuario);
    fixture.detectChanges();

    expect(texto()).toContain('Ana Pérez');
    expect(texto()).not.toContain('Bienvenido a la clínica virtual');

    const info = fixture.nativeElement.querySelector('[aria-label^="Tipo de usuario"]');
    expect(info.getAttribute('aria-label')).toBe('Tipo de usuario: Médico');

    const botones = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'));
    botones.find((b) => b.textContent!.includes('Cerrar sesión'))!.click();
    expect(logout).toHaveBeenCalled();
  });
});
