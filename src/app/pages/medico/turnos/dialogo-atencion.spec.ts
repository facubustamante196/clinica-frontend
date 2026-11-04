import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Turno } from '../../../core/models';
import { TurnoService } from '../../../core/services/turno.service';
import { DialogoAtencion } from './dialogo-atencion';

describe('DialogoAtencion', () => {
  const turno = {
    id: 40,
    hora: '10:00',
    nombre_paciente: 'Lucia',
    apellido_paciente: 'Fernandez',
  } as Turno;
  const turnoService = { atender: vi.fn() };
  const dialogRef = { close: vi.fn() };
  let c: Record<string, any>;

  beforeEach(() => {
    vi.resetAllMocks();
    turnoService.atender.mockReturnValue(of(turno));
    TestBed.configureTestingModule({
      imports: [DialogoAtencion],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { turno } },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: TurnoService, useValue: turnoService },
      ],
    });
    const fixture = TestBed.createComponent(DialogoAtencion);
    fixture.detectChanges();
    c = fixture.componentInstance as unknown as Record<string, any>;
  });

  it('exige diagnóstico y tratamiento; las observaciones son opcionales', () => {
    expect(c['form'].invalid).toBe(true);

    c['form'].patchValue({ diagnostico: '  ', tratamiento: 'Reposo' });
    expect(c['form'].controls.diagnostico.hasError('required')).toBe(true);

    c['form'].patchValue({ diagnostico: 'Esguince', tratamiento: 'Reposo' });
    expect(c['form'].valid).toBe(true);
  });

  it('no permite más de 255 caracteres por campo', () => {
    c['form'].patchValue({ diagnostico: 'a'.repeat(256), tratamiento: 'x' });

    expect(c['form'].controls.diagnostico.hasError('maxlength')).toBe(true);
  });

  it('no envía si el formulario es inválido', () => {
    c['guardar']();

    expect(turnoService.atender).not.toHaveBeenCalled();
  });

  it('envía los datos clínicos recortados y cierra con true', () => {
    c['form'].patchValue({ diagnostico: ' Esguince ', tratamiento: ' Reposo ', observaciones: ' ' });

    c['guardar']();

    expect(turnoService.atender).toHaveBeenCalledWith(40, {
      diagnostico: 'Esguince',
      tratamiento: 'Reposo',
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('incluye las observaciones cuando se completan', () => {
    c['form'].patchValue({ diagnostico: 'A', tratamiento: 'B', observaciones: ' Control ' });

    c['guardar']();

    expect(turnoService.atender).toHaveBeenCalledWith(40, {
      diagnostico: 'A',
      tratamiento: 'B',
      observaciones: 'Control',
    });
  });

  it('si el backend rechaza la atención muestra el mensaje y no cierra', () => {
    c['form'].patchValue({ diagnostico: 'A', tratamiento: 'B' });
    turnoService.atender.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { mensaje: 'Solo se pueden atender turnos confirmados' },
          }),
      ),
    );

    c['guardar']();

    expect(c['errorEnvio']()).toBe('Solo se pueden atender turnos confirmados');
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
