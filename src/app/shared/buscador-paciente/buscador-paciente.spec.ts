import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PacienteBusqueda } from '../../core/models';
import { PacienteService } from '../../core/services/paciente.service';
import { BuscadorPaciente } from './buscador-paciente';

describe('BuscadorPaciente', () => {
  const lucia: PacienteBusqueda = {
    id: 16,
    nombre: 'Lucia',
    apellido: 'Fernandez',
    dni: '30000021',
    fecha_nacimiento: '1995-04-12',
    id_cobertura: 1,
    cobertura_nombre: 'Jerarquicos',
  };
  const pacienteService = { buscar: vi.fn() };
  let fixture: ComponentFixture<BuscadorPaciente>;
  let c: Record<string, any>;

  beforeEach(() => {
    vi.resetAllMocks();
    pacienteService.buscar.mockReturnValue(of([lucia]));
    TestBed.configureTestingModule({
      imports: [BuscadorPaciente],
      providers: [{ provide: PacienteService, useValue: pacienteService }],
    });
    fixture = TestBed.createComponent(BuscadorPaciente);
    fixture.detectChanges();
    c = fixture.componentInstance as unknown as Record<string, any>;
  });

  it('no busca sin DNI ni apellido', () => {
    c['buscar']();

    expect(pacienteService.buscar).not.toHaveBeenCalled();
    expect(c['busqueda'].hasError('faltaFiltro')).toBe(true);
  });

  it('valida el DNI (solo números, hasta 8) y el apellido (mínimo 2 letras)', () => {
    c['busqueda'].patchValue({ dni: '12a' });
    expect(c['busqueda'].controls.dni.hasError('pattern')).toBe(true);

    c['busqueda'].patchValue({ dni: '123456789' });
    expect(c['busqueda'].controls.dni.hasError('pattern')).toBe(true);

    c['busqueda'].patchValue({ dni: '', apellido: 'F' });
    expect(c['busqueda'].controls.apellido.hasError('minlength')).toBe(true);
    expect(c['busqueda'].invalid).toBe(true);
  });

  it('busca por apellido y lista los resultados', () => {
    c['busqueda'].patchValue({ apellido: ' Fer ' });

    c['buscar']();

    expect(pacienteService.buscar).toHaveBeenCalledWith({ dni: '', apellido: 'Fer' });
    expect(c['pacientes']()).toEqual([lucia]);
  });

  it('busca por DNI', () => {
    c['busqueda'].patchValue({ dni: '30000021' });

    c['buscar']();

    expect(pacienteService.buscar).toHaveBeenCalledWith({ dni: '30000021', apellido: '' });
  });

  it('muestra el mensaje del backend si la búsqueda falla', () => {
    pacienteService.buscar.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 400, error: { mensaje: 'Debe indicar dni o apellido para buscar' } }),
      ),
    );
    c['busqueda'].patchValue({ apellido: 'Fe' });

    c['buscar']();

    expect(c['errorBusqueda']()).toBe('Debe indicar dni o apellido para buscar');
    expect(c['pacientes']()).toBeNull();
  });

  it('emite el paciente de la fila elegida', () => {
    c['busqueda'].patchValue({ apellido: 'Fer' });
    c['buscar']();
    fixture.detectChanges();
    let elegido: PacienteBusqueda | undefined;
    fixture.componentInstance.elegido.subscribe((p) => (elegido = p));

    const boton: HTMLButtonElement = fixture.nativeElement.querySelector('td button');
    boton.click();

    expect(elegido).toEqual(lucia);
  });
});
