import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { Usuario } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Header } from './header';

describe('Header', () => {
  const usuario = signal<Usuario | null>(null);
  const logout = vi.fn();
  const noLeidas = signal(0);
  const refrescar = vi.fn();
  let fixture: ComponentFixture<Header>;

  const texto = (): string => fixture.nativeElement.textContent.replace(/\s+/g, ' ');

  beforeEach(async () => {
    usuario.set(null);
    logout.mockClear();
    noLeidas.set(0);
    refrescar.mockClear();
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [
        provideRouter([]),
        {
          provide: NotificacionService,
          useValue: {
            notificaciones: signal([]).asReadonly(),
            noLeidas: noLeidas.asReadonly(),
            refrescar,
            limpiar: vi.fn(),
            marcarLeida: vi.fn(),
          },
        },
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

  it('sin sesión no muestra el usuario ni el botón de cerrar sesión', () => {
    expect(texto()).not.toContain('Cerrar sesión');
    expect(fixture.nativeElement.querySelector('.usuario')).toBeNull();
  });

  it('con sesión muestra nombre, tipo de usuario y permite cerrar sesión', () => {
    usuario.set({ nombre: 'Ana', apellido: 'Pérez', rol: 'medico' } as Usuario);
    fixture.detectChanges();

    expect(texto()).toContain('Ana Pérez');
    expect(fixture.nativeElement.querySelector('.rol').textContent).toContain('Médico');

    const botones = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'));
    botones.find((b) => b.textContent!.includes('Cerrar sesión'))!.click();
    expect(logout).toHaveBeenCalled();
  });

  it('muestra el contador de no leídas solo si hay alguna', () => {
    usuario.set({ nombre: 'Ana', apellido: 'Pérez', rol: 'paciente' } as Usuario);
    fixture.detectChanges();
    const badge = () => fixture.nativeElement.querySelector('.mat-badge-content') as HTMLElement;
    const oculto = () => fixture.nativeElement.querySelector('.mat-badge-hidden') !== null;

    expect(oculto()).toBe(true);

    noLeidas.set(3);
    fixture.detectChanges();
    expect(oculto()).toBe(false);
    expect(badge().textContent).toContain('3');
  });
});
