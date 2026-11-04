import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Agenda } from '../../../core/models';
import { AgendaService } from '../../../core/services/agenda.service';
import { AuthService } from '../../../core/services/auth.service';
import { MedicoService } from '../../../core/services/medico.service';
import { SedeService } from '../../../core/services/sede.service';
import { AgendasOperador } from './agendas-operador';

describe('AgendasOperador', () => {
  const sedes = [
    { id: 1, nombre: 'Sede Centro', direccion: 'x', telefono: '1' },
    { id: 6, nombre: 'Sede Sur', direccion: 'y', telefono: '6' },
  ];
  const agenda = (id: number, sede: number, entrada: string, apellido: string): Agenda => ({
    id,
    fecha: '2026-11-05',
    hora_entrada: entrada,
    hora_salida: '13:00',
    id_medico: id,
    id_especialidad: 2,
    id_sede: sede,
    medico_nombre: 'Dr',
    medico_apellido: apellido,
    especialidad_descripcion: 'Cardiologia',
    sede_nombre: sede === 1 ? 'Sede Centro' : 'Sede Sur',
  });

  const agendaService = { listar: vi.fn() };
  const idSede = signal<number | null>(1);
  let fixture: ComponentFixture<AgendasOperador>;
  let c: Record<string, any>;

  function crear() {
    fixture = TestBed.createComponent(AgendasOperador);
    fixture.detectChanges();
    c = fixture.componentInstance as unknown as Record<string, any>;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    idSede.set(1);
    agendaService.listar.mockReturnValue(
      of([agenda(2, 1, '10:00', 'Rios'), agenda(1, 1, '09:00', 'Martinez')]),
    );
    TestBed.configureTestingModule({
      imports: [AgendasOperador],
      providers: [
        provideNativeDateAdapter(),
        {
          provide: AuthService,
          useValue: { usuario: computed(() => ({ id: 11, rol: 'operador', id_sede: idSede() })) },
        },
        { provide: AgendaService, useValue: agendaService },
        { provide: MedicoService, useValue: { listar: () => of([]) } },
        { provide: SedeService, useValue: { listar: () => of(sedes) } },
      ],
    });
  });

  it('al entrar muestra la fecha de hoy y la sede del operador', () => {
    crear();

    expect(c['sede'].value).toBe(1);
    const hoy = new Date();
    expect(c['fecha'].value.toDateString()).toBe(hoy.toDateString());
    expect(agendaService.listar).toHaveBeenCalledWith(
      expect.objectContaining({ id_sede: 1, fecha: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) }),
    );
  });

  it('ordena la tabla por horario', () => {
    crear();

    expect(c['ordenadas']().map((a: Agenda) => a.medico_apellido)).toEqual(['Martinez', 'Rios']);
  });

  it('al cambiar la sede o la fecha vuelve a consultar', () => {
    crear();
    agendaService.listar.mockClear();

    c['sede'].setValue(6);
    expect(agendaService.listar).toHaveBeenLastCalledWith(expect.objectContaining({ id_sede: 6 }));

    c['fecha'].setValue(new Date(2026, 10, 9));
    expect(agendaService.listar).toHaveBeenLastCalledWith({ id_sede: 6, fecha: '2026-11-09' });
    expect(agendaService.listar).toHaveBeenCalledTimes(2);
  });

  it('en su sede puede modificar; en otra sede solo consultar', () => {
    crear();
    expect(c['puedeModificar']()).toBe(true);

    c['sede'].setValue(6);
    expect(c['puedeModificar']()).toBe(false);

    c['sede'].setValue(1);
    expect(c['puedeModificar']()).toBe(true);
  });

  it('en otra sede deshabilita "Nueva agenda" y el lápiz, pero deja el ojo', () => {
    crear();
    c['sede'].setValue(6);
    fixture.detectChanges();

    const raiz: HTMLElement = fixture.nativeElement;
    const nueva = Array.from(raiz.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Nueva agenda'),
    ) as HTMLButtonElement;
    const lapiz = raiz.querySelector('button[aria-label="Editar la agenda del médico"]') as HTMLButtonElement;
    const ojo = raiz.querySelector('button[aria-label="Ver los turnos confirmados del médico"]') as HTMLButtonElement;

    expect(nueva.disabled).toBe(true);
    expect(lapiz.disabled).toBe(true);
    expect(ojo.disabled).toBe(false);
  });

  it('en su sede habilita "Nueva agenda" y el lápiz', () => {
    crear();
    fixture.detectChanges();

    const raiz: HTMLElement = fixture.nativeElement;
    const nueva = Array.from(raiz.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Nueva agenda'),
    ) as HTMLButtonElement;
    const lapiz = raiz.querySelector('button[aria-label="Editar la agenda del médico"]') as HTMLButtonElement;

    expect(nueva.disabled).toBe(false);
    expect(lapiz.disabled).toBe(false);
  });

  it('un operador sin sede no consulta nada y ve el aviso', () => {
    idSede.set(null);
    crear();

    expect(agendaService.listar).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('no tiene una sede asignada');
  });

  it('sin agendas muestra el mensaje en lugar de una tabla vacía', () => {
    agendaService.listar.mockReturnValue(of([]));
    crear();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No hay médicos con agenda');
  });
});
