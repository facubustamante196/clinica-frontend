import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PacienteBusqueda, Turno } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CoberturaService } from '../../core/services/cobertura.service';
import { DisponibilidadService } from '../../core/services/disponibilidad.service';
import { EspecialidadService } from '../../core/services/especialidad.service';
import { MedicoService } from '../../core/services/medico.service';
import { SedeService } from '../../core/services/sede.service';
import { TurnoService } from '../../core/services/turno.service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { NuevoTurno } from './nuevo-turno';

describe('NuevoTurno', () => {
  const sedes = [
    { id: 1, nombre: 'Sede Centro', direccion: 'Calle 1', telefono: '1' },
    { id: 6, nombre: 'Sede Sur', direccion: 'Calle 6', telefono: '6' },
  ];
  const medico = { id: 13, nombre: 'Laura', apellido: 'Martinez', especialidades: [] };
  const turnoCreado = { id: 99, fecha: '2026-11-05', hora: '10:00' } as Turno;

  const medicoService = { listar: vi.fn() };
  const disponibilidad = { fechas: vi.fn(), horarios: vi.fn() };
  const turnoService = { crear: vi.fn() };

  let fixture: ComponentFixture<NuevoTurno>;
  let c: NuevoTurno;

  // Los miembros protegidos se usan igual que desde la plantilla.
  const comp = () => c as unknown as Record<string, any>;

  function crear(entradas: { sedeFija?: number; paciente?: PacienteBusqueda } = {}) {
    fixture = TestBed.createComponent(NuevoTurno);
    c = fixture.componentInstance;
    if (entradas.sedeFija !== undefined) fixture.componentRef.setInput('sedeFija', entradas.sedeFija);
    if (entradas.paciente) fixture.componentRef.setInput('paciente', entradas.paciente);
    fixture.detectChanges();
    fixture.detectChanges();
  }

  function elegirHastaHorario() {
    comp()['elegirEspecialidad'](1);
    comp()['elegirSede'](1);
    comp()['elegirMedico'](13);
    comp()['elegirFecha'](new Date(2026, 10, 5));
    comp()['elegirHora']('10:00');
  }

  beforeEach(async () => {
    vi.resetAllMocks();
    medicoService.listar.mockReturnValue(of([medico]));
    disponibilidad.fechas.mockReturnValue(of(['2026-11-05', '2026-11-06']));
    disponibilidad.horarios.mockReturnValue(of(['09:00', '09:30', '10:00']));
    turnoService.crear.mockReturnValue(of(turnoCreado));

    await TestBed.configureTestingModule({
      imports: [NuevoTurno],
      providers: [
        provideNativeDateAdapter(),
        { provide: AuthService, useValue: { usuario: signal({ id_cobertura: 1 }) } },
        { provide: EspecialidadService, useValue: { listar: () => of([{ id: 1, descripcion: 'Cardiologia' }]) } },
        { provide: SedeService, useValue: { listar: () => of(sedes) } },
        { provide: CoberturaService, useValue: { listar: () => of([{ id: 1, nombre: 'Jerarquicos' }]) } },
        { provide: MedicoService, useValue: medicoService },
        { provide: DisponibilidadService, useValue: disponibilidad },
        { provide: TurnoService, useValue: turnoService },
      ],
    }).compileComponents();
  });

  it('carga especialidades y sedes de la API y toma la cobertura del usuario', () => {
    crear();

    expect(comp()['especialidades']()).toHaveLength(1);
    expect(comp()['sedes']()).toHaveLength(2);
    expect(comp()['nombreCobertura']()).toBe('Jerarquicos');
  });

  it('con un paciente indicado muestra la cobertura de ese paciente', () => {
    crear({
      paciente: {
        id: 21,
        nombre: 'Lucia',
        apellido: 'Fernandez',
        dni: '30000021',
        fecha_nacimiento: '1995-04-12',
        id_cobertura: 5,
        cobertura_nombre: 'Osde',
      },
    });

    expect(comp()['nombreCobertura']()).toBe('Osde');
  });

  it('pide médicos solo cuando están elegidas la especialidad y la sede, filtrando por ambas', () => {
    crear();

    comp()['elegirEspecialidad'](1);
    expect(medicoService.listar).not.toHaveBeenCalled();

    comp()['elegirSede'](6);
    expect(medicoService.listar).toHaveBeenCalledWith({ id_especialidad: 1, id_sede: 6 });
    expect(comp()['medicos']()).toEqual([medico]);
  });

  it('con sede fija la sede queda elegida y bloqueada', () => {
    crear({ sedeFija: 1 });

    expect(comp()['idSede']()).toBe(1);
    expect(comp()['sedeBloqueada']()).toBe(true);

    comp()['elegirEspecialidad'](1);
    expect(medicoService.listar).toHaveBeenCalledWith({ id_especialidad: 1, id_sede: 1 });
  });

  it('solo permite elegir en el calendario las fechas con disponibilidad', () => {
    crear();
    comp()['elegirEspecialidad'](1);
    comp()['elegirSede'](1);
    comp()['elegirMedico'](13);

    expect(disponibilidad.fechas).toHaveBeenCalledWith({
      id_medico: 13,
      id_especialidad: 1,
      id_sede: 1,
    });
    const permitida = comp()['filtroFecha']();
    expect(permitida(new Date(2026, 10, 5))).toBe(true);
    expect(permitida(new Date(2026, 10, 7))).toBe(false);
    expect(permitida(null)).toBe(false);
  });

  it('al elegir una fecha pide los horarios libres de ese día', () => {
    crear();
    comp()['elegirEspecialidad'](1);
    comp()['elegirSede'](1);
    comp()['elegirMedico'](13);
    comp()['elegirFecha'](new Date(2026, 10, 5));

    expect(comp()['fecha']()).toBe('2026-11-05');
    expect(disponibilidad.horarios).toHaveBeenCalledWith(
      { id_medico: 13, id_especialidad: 1, id_sede: 1 },
      '2026-11-05',
    );
    expect(comp()['horarios']()).toEqual(['09:00', '09:30', '10:00']);
  });

  it('cambiar un paso anterior limpia los siguientes', () => {
    crear();
    elegirHastaHorario();

    comp()['elegirSede'](6);

    expect(comp()['idMedico']()).toBeNull();
    expect(comp()['fecha']()).toBeNull();
    expect(comp()['hora']()).toBeNull();
    expect(comp()['horarios']()).toEqual([]);
  });

  it('no envía el turno si falta la nota', () => {
    crear();
    elegirHastaHorario();

    comp()['nota'].setValue('   ');
    comp()['confirmar']();

    expect(turnoService.crear).not.toHaveBeenCalled();
  });

  it('el paciente envía su turno sin id_paciente y con la nota recortada', () => {
    crear();
    elegirHastaHorario();
    comp()['nota'].setValue('  Control anual  ');

    comp()['confirmar']();

    expect(turnoService.crear).toHaveBeenCalledWith({
      id_especialidad: 1,
      id_sede: 1,
      id_medico: 13,
      fecha: '2026-11-05',
      hora: '10:00',
      nota: 'Control anual',
    });
    expect(comp()['turnoCreado']()).toEqual(turnoCreado);
  });

  it('el operador envía el turno con el id del paciente elegido', () => {
    crear({
      sedeFija: 1,
      paciente: {
        id: 21,
        nombre: 'Lucia',
        apellido: 'Fernandez',
        dni: '30000021',
        fecha_nacimiento: '1995-04-12',
        id_cobertura: 1,
        cobertura_nombre: 'Jerarquicos',
      },
    });
    comp()['elegirEspecialidad'](1);
    comp()['elegirMedico'](13);
    comp()['elegirFecha'](new Date(2026, 10, 5));
    comp()['elegirHora']('09:30');
    comp()['nota'].setValue('Control');

    comp()['confirmar']();

    expect(turnoService.crear).toHaveBeenCalledWith(
      expect.objectContaining({ id_paciente: 21, id_sede: 1, hora: '09:30' }),
    );
  });

  it('si el backend rechaza el turno muestra el mensaje y vuelve a pedir los horarios', () => {
    crear();
    elegirHastaHorario();
    comp()['nota'].setValue('Control');
    turnoService.crear.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { mensaje: 'El horario se superpone con otro turno confirmado' },
          }),
      ),
    );
    disponibilidad.horarios.mockClear();
    disponibilidad.horarios.mockReturnValue(of(['09:00', '09:30']));

    comp()['confirmar']();

    expect(comp()['errorEnvio']()).toBe('El horario se superpone con otro turno confirmado');
    expect(comp()['hora']()).toBeNull();
    expect(comp()['turnoCreado']()).toBeNull();
    expect(disponibilidad.horarios).toHaveBeenCalledTimes(1);
    expect(comp()['horarios']()).toEqual(['09:00', '09:30']);
  });

  it('después de confirmar permite pedir otro turno desde cero', () => {
    crear({ sedeFija: 1 });
    elegirHastaHorario();
    comp()['nota'].setValue('Control');
    comp()['confirmar']();
    fixture.detectChanges();

    comp()['reiniciar']();

    expect(comp()['turnoCreado']()).toBeNull();
    expect(comp()['idEspecialidad']()).toBeNull();
    expect(comp()['idSede']()).toBe(1);
    expect(comp()['nota'].value).toBe('');
  });
});
