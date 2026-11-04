import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Turno } from '../../../core/models';
import { SedeService } from '../../../core/services/sede.service';
import { TurnoService } from '../../../core/services/turno.service';
import { fechaIso } from '../../../core/utils/fechas';
import { TurnosMedico } from './turnos-medico';

describe('TurnosMedico', () => {
  const turno = (id: number, hora: string, estado: Turno['estado'], sede = 'Sede Centro'): Turno =>
    ({
      id,
      fecha: fechaIso(new Date()),
      hora,
      estado,
      nota: `nota ${id}`,
      id_sede: 1,
      sede,
      nombre_paciente: 'Lucia',
      apellido_paciente: `Paciente${id}`,
      fecha_nacimiento_paciente: '1995-04-12',
    }) as Turno;

  const turnoService = { listar: vi.fn(), cancelar: vi.fn(), atender: vi.fn() };
  let fixture: ComponentFixture<TurnosMedico>;
  let c: Record<string, any>;

  beforeEach(() => {
    vi.resetAllMocks();
    turnoService.listar.mockReturnValue(
      of([turno(1, '09:00', 'confirmado'), turno(2, '11:00', 'atendido'), turno(3, '10:00', 'cancelado')]),
    );
    TestBed.configureTestingModule({
      imports: [TurnosMedico],
      providers: [
        provideNativeDateAdapter(),
        { provide: TurnoService, useValue: turnoService },
        {
          provide: SedeService,
          useValue: { listar: () => of([{ id: 1, nombre: 'Sede Centro', direccion: 'x', telefono: '1' }]) },
        },
      ],
    });
    fixture = TestBed.createComponent(TurnosMedico);
    fixture.detectChanges();
    c = fixture.componentInstance as unknown as Record<string, any>;
  });

  it('por defecto pide los turnos del día actual, sin filtro de sede', () => {
    expect(turnoService.listar).toHaveBeenCalledWith({ fecha: fechaIso(new Date()) });
  });

  it('al elegir una sede la envía como filtro y al quitarla vuelve a todas', () => {
    c['sede'].setValue(1);
    expect(turnoService.listar).toHaveBeenLastCalledWith({ fecha: fechaIso(new Date()), id_sede: 1 });

    c['sede'].setValue(null);
    expect(turnoService.listar).toHaveBeenLastCalledWith({ fecha: fechaIso(new Date()) });
  });

  it('al cambiar la fecha vuelve a consultar con esa fecha', () => {
    c['fecha'].setValue(new Date(2026, 10, 9));

    expect(turnoService.listar).toHaveBeenLastCalledWith({ fecha: '2026-11-09' });
  });

  it('ordena por proximidad al momento actual', () => {
    const hoy = new Date();
    hoy.setHours(10, 0, 0, 0);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(hoy);
    try {
      turnoService.listar.mockReturnValue(
        of([turno(1, '09:00', 'confirmado'), turno(2, '11:30', 'confirmado'), turno(3, '10:15', 'confirmado')]),
      );
      c['cargar']();

      expect(c['ordenados']().map((t: Turno) => t.id)).toEqual([3, 1, 2]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('muestra la edad calculada y solo ofrece acciones en turnos confirmados', () => {
    fixture.detectChanges();
    const raiz: HTMLElement = fixture.nativeElement;
    const filas = Array.from(raiz.querySelectorAll('tr.fila'));
    expect(filas).toHaveLength(3);

    const atender = Array.from(raiz.querySelectorAll('button')).filter((b) =>
      b.textContent?.includes('Marcar como atendido'),
    );
    expect(atender).toHaveLength(1);
    expect(raiz.textContent).toMatch(/\b3\d\b/);
  });

  it('al hacer click en un turno se despliega la nota y al repetirlo se oculta', () => {
    fixture.detectChanges();
    const fila = fixture.nativeElement.querySelector('tr.fila') as HTMLElement;

    fila.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('nota ');

    fila.click();
    fixture.detectChanges();
    expect(c['expandido']()).toBeNull();
  });

  it('sin turnos muestra el mensaje en lugar de una tabla vacía', () => {
    turnoService.listar.mockReturnValue(of([]));
    c['cargar']();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('table')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No hay turnos');
  });
});
