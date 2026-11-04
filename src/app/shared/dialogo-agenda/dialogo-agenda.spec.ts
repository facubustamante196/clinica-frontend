import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Agenda, Medico, Sede } from '../../core/models';
import { AgendaService } from '../../core/services/agenda.service';
import { DatosDialogoAgenda, DialogoAgenda, salidaPosteriorAEntrada } from './dialogo-agenda';

describe('salidaPosteriorAEntrada', () => {
  const grupo = (entrada: string, salida: string) =>
    new FormGroup({ hora_entrada: new FormControl(entrada), hora_salida: new FormControl(salida) });

  it('acepta salida posterior a la entrada', () => {
    expect(salidaPosteriorAEntrada(grupo('09:00', '12:00'))).toBeNull();
  });

  it('rechaza salida igual o anterior a la entrada', () => {
    expect(salidaPosteriorAEntrada(grupo('09:00', '09:00'))).toEqual({ salidaAnterior: true });
    expect(salidaPosteriorAEntrada(grupo('12:00', '09:00'))).toEqual({ salidaAnterior: true });
  });

  it('no valida si falta alguna hora (lo resuelve el required)', () => {
    expect(salidaPosteriorAEntrada(grupo('', '09:00'))).toBeNull();
  });
});

describe('DialogoAgenda', () => {
  const sedes: Sede[] = [
    { id: 1, nombre: 'Sede Centro', direccion: 'x', telefono: '1' },
    { id: 6, nombre: 'Sede Sur', direccion: 'y', telefono: '6' },
  ];
  const laura: Medico = {
    id: 13,
    nombre: 'Laura',
    apellido: 'Martinez',
    especialidades: [{ id: 2, descripcion: 'Cardiologia' }],
  };
  const sofia: Medico = {
    id: 15,
    nombre: 'Sofia',
    apellido: 'Herrera',
    especialidades: [
      { id: 2, descripcion: 'Cardiologia' },
      { id: 3, descripcion: 'Dermatologia' },
    ],
  };

  const agendaService = { crear: vi.fn(), modificar: vi.fn() };
  const dialogRef = { close: vi.fn() };

  function abrir(datos: DatosDialogoAgenda) {
    TestBed.configureTestingModule({
      imports: [DialogoAgenda],
      providers: [
        provideNativeDateAdapter(),
        { provide: MAT_DIALOG_DATA, useValue: datos },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: AgendaService, useValue: agendaService },
      ],
    });
    const fixture = TestBed.createComponent(DialogoAgenda);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as Record<string, any>;
  }

  beforeEach(() => {
    vi.resetAllMocks();
    agendaService.crear.mockReturnValue(of(undefined));
    agendaService.modificar.mockReturnValue(of(undefined));
  });

  it('médico único: queda elegido y bloqueado, con su especialidad y la sede inicial', () => {
    const c = abrir({ medicos: [laura], sedes, idSedeInicial: 1, fecha: '2026-11-05' });

    expect(c['form'].getRawValue()).toMatchObject({ id_medico: 13, id_especialidad: 2, id_sede: 1 });
    expect(c['form'].controls.id_medico.disabled).toBe(true);
    expect(c['especialidades']()).toEqual(laura.especialidades);
  });

  it('con sede bloqueada no se puede cambiar la sede', () => {
    const c = abrir({ medicos: [laura], sedes, idSedeInicial: 1, sedeBloqueada: true });

    expect(c['form'].controls.id_sede.disabled).toBe(true);
    expect(c['form'].getRawValue().id_sede).toBe(1);
  });

  it('varias especialidades: hay que elegir una y el formulario es inválido hasta entonces', () => {
    const c = abrir({ medicos: [sofia], sedes, idSedeInicial: 1 });
    c['form'].patchValue({ hora_entrada: '09:00', hora_salida: '12:00' });

    expect(c['form'].controls.id_especialidad.value).toBeNull();
    expect(c['form'].invalid).toBe(true);
    c['form'].controls.id_especialidad.setValue(3);
    expect(c['form'].valid).toBe(true);
  });

  it('con varios médicos, al cambiar de médico se ofrecen sus especialidades', () => {
    const c = abrir({ medicos: [laura, sofia], sedes, idSedeInicial: 1 });

    c['form'].controls.id_medico.setValue(15);

    expect(c['especialidades']()).toHaveLength(2);
    expect(c['form'].controls.id_especialidad.value).toBeNull();
    c['form'].controls.id_medico.setValue(13);
    expect(c['form'].controls.id_especialidad.value).toBe(2);
  });

  it('no envía si la hora de salida no es posterior a la de entrada', () => {
    const c = abrir({ medicos: [laura], sedes, idSedeInicial: 1 });
    c['form'].patchValue({ hora_entrada: '12:00', hora_salida: '09:00' });

    c['guardar']();

    expect(agendaService.crear).not.toHaveBeenCalled();
    expect(c['form'].hasError('salidaAnterior')).toBe(true);
  });

  it('alta: envía el rango y cierra con true', () => {
    const c = abrir({ medicos: [laura], sedes, idSedeInicial: 1 });
    c['form'].patchValue({ fecha: new Date(2026, 10, 5), hora_entrada: '09:00', hora_salida: '12:00' });

    c['guardar']();

    expect(agendaService.crear).toHaveBeenCalledWith({
      fecha: '2026-11-05',
      hora_entrada: '09:00',
      hora_salida: '12:00',
      id_medico: 13,
      id_especialidad: 2,
      id_sede: 1,
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('modificación: precarga el rango, bloquea el médico y usa PUT', () => {
    const agenda: Agenda = {
      id: 7,
      fecha: '2026-11-06',
      hora_entrada: '14:00',
      hora_salida: '18:00',
      id_medico: 13,
      id_especialidad: 2,
      id_sede: 1,
      medico_nombre: 'Laura',
      medico_apellido: 'Martinez',
      especialidad_descripcion: 'Cardiologia',
      sede_nombre: 'Sede Centro',
    };
    const c = abrir({ medicos: [laura, sofia], sedes, agenda });

    expect(c['form'].controls.id_medico.disabled).toBe(true);
    expect(c['form'].getRawValue()).toMatchObject({ hora_entrada: '14:00', hora_salida: '18:00' });

    c['form'].controls.hora_salida.setValue('19:00');
    c['guardar']();

    expect(agendaService.modificar).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ fecha: '2026-11-06', hora_salida: '19:00' }),
    );
    expect(agendaService.crear).not.toHaveBeenCalled();
  });

  it('si el backend rechaza el cambio muestra el mensaje y no cierra', () => {
    const c = abrir({ medicos: [laura], sedes, idSedeInicial: 1 });
    c['form'].patchValue({ fecha: new Date(2026, 10, 5), hora_entrada: '09:00', hora_salida: '10:00' });
    agendaService.crear.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              mensaje:
                'No se puede modificar el horario: hay turnos confirmados que quedarian fuera del nuevo rango',
            },
          }),
      ),
    );

    c['guardar']();

    expect(c['errorEnvio']()).toContain('turnos confirmados');
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(c['enviando']()).toBe(false);
  });
});
