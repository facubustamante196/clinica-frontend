import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNativeDateAdapter } from '@angular/material/core';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { RegistroResponse } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { CoberturaService } from '../../core/services/cobertura.service';
import { FormPaciente } from '../../shared/form-paciente/form-paciente';
import { Registro } from './registro';

describe('Registro', () => {
  let fixture: ComponentFixture<Registro>;
  let navegar: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Registro],
      providers: [
        provideRouter([]),
        provideNativeDateAdapter(),
        { provide: AuthService, useValue: { registrar: vi.fn() } },
        { provide: CoberturaService, useValue: { listar: () => of([]) } },
      ],
    }).compileComponents();

    navegar = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(Registro);
    fixture.detectChanges();
  });

  it('usa el formulario reutilizable de alta de paciente', () => {
    expect(fixture.debugElement.query(By.directive(FormPaciente))).toBeTruthy();
  });

  it('redirige al login cuando el alta sale bien', () => {
    const formulario = fixture.debugElement.query(By.directive(FormPaciente))
      .componentInstance as FormPaciente;
    formulario.registrado.emit({ id: 1 } as RegistroResponse);

    expect(navegar).toHaveBeenCalledWith('/login');
  });
});
