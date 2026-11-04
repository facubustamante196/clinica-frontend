import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { RegistroResponse } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CoberturaService } from '../../core/services/cobertura.service';
import { FormPaciente } from './form-paciente';

const RESPUESTA: RegistroResponse = {
  id: 1,
  nombre: 'Ana',
  apellido: 'Pérez',
  dni: '30111222',
  email: 'ana@mail.com',
  rol: 'paciente',
};

describe('FormPaciente', () => {
  let fixture: ComponentFixture<FormPaciente>;
  let componente: FormPaciente;
  let registrar: ReturnType<typeof vi.fn>;
  let registrado: ReturnType<typeof vi.fn<(paciente: RegistroResponse) => void>>;

  const form = () => componente['form'];

  const completarFormularioValido = () =>
    form().setValue({
      nombre: 'Ana',
      apellido: 'Pérez',
      dni: '30111222',
      email: 'ana@mail.com',
      password: 'secreto1',
      fechaNacimiento: new Date(1990, 4, 17),
      idCobertura: 1,
    });

  beforeEach(async () => {
    registrar = vi.fn().mockReturnValue(of(RESPUESTA));

    await TestBed.configureTestingModule({
      imports: [FormPaciente],
      providers: [
        provideNativeDateAdapter(),
        { provide: AuthService, useValue: { registrar } },
        {
          provide: CoberturaService,
          useValue: {
            listar: () =>
              of([
                { id: 1, nombre: 'Osde' },
                { id: 2, nombre: 'Swiss Medical' },
              ]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FormPaciente);
    componente = fixture.componentInstance;
    registrado = vi.fn<(paciente: RegistroResponse) => void>();
    componente.registrado.subscribe(registrado);
    fixture.detectChanges();
  });

  it('carga las coberturas al iniciar', () => {
    expect(componente['coberturas']().length).toBe(2);
    expect(componente['cargandoCoberturas']()).toBe(false);
  });

  it('no envía si el formulario está vacío y marca los campos', () => {
    componente['registrar']();

    expect(registrar).not.toHaveBeenCalled();
    expect(form().controls.nombre.touched).toBe(true);
    expect(form().controls.nombre.hasError('required')).toBe(true);
  });

  it('rechaza un DNI no numérico', () => {
    form().controls.dni.setValue('30.111.222');
    expect(form().controls.dni.hasError('pattern')).toBe(true);

    form().controls.dni.setValue('30111222');
    expect(form().controls.dni.valid).toBe(true);
  });

  it('rechaza un email con formato inválido', () => {
    form().controls.email.setValue('ana@');
    expect(form().controls.email.hasError('pattern')).toBe(true);

    form().controls.email.setValue('ana@mail.com');
    expect(form().controls.email.valid).toBe(true);
  });

  it('exige una contraseña de al menos 6 caracteres', () => {
    form().controls.password.setValue('12345');
    expect(form().controls.password.hasError('minlength')).toBe(true);
  });

  it('envía la fecha como YYYY-MM-DD y la cobertura como id', () => {
    completarFormularioValido();
    componente['registrar']();

    expect(registrar).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellido: 'Pérez',
      dni: '30111222',
      email: 'ana@mail.com',
      password: 'secreto1',
      fecha_nacimiento: '1990-05-17',
      id_cobertura: 1,
    });
  });

  it('emite el paciente creado y vacía el formulario', () => {
    completarFormularioValido();
    componente['registrar']();

    expect(registrado).toHaveBeenCalledWith(RESPUESTA);
    expect(form().controls.nombre.value).toBe('');
  });

  it('muestra un mensaje claro ante DNI o email duplicado (409)', () => {
    registrar.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { mensaje: 'duplicado' } })),
    );
    completarFormularioValido();
    componente['registrar']();

    expect(componente['errorEnvio']()).toContain('DNI o email');
    expect(registrado).not.toHaveBeenCalled();
    expect(componente['cargando']()).toBe(false);
  });

  it('informa cuando no hay conexión con el servidor', () => {
    registrar.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    completarFormularioValido();
    componente['registrar']();

    expect(componente['errorEnvio']()).toContain('conectar con el servidor');
  });
});
