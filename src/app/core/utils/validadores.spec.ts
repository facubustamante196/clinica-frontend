import { FormControl, FormGroup } from '@angular/forms';

import { camposCoinciden, obligatorioSinEspacios } from './validadores';

describe('validadores', () => {
  describe('obligatorioSinEspacios', () => {
    it('rechaza vacío y solo espacios, acepta texto', () => {
      expect(obligatorioSinEspacios(new FormControl(''))).toEqual({ required: true });
      expect(obligatorioSinEspacios(new FormControl('   '))).toEqual({ required: true });
      expect(obligatorioSinEspacios(new FormControl('Ana'))).toBeNull();
    });
  });

  describe('camposCoinciden', () => {
    const grupo = (nueva: string, repetir: string) =>
      new FormGroup(
        { nueva: new FormControl(nueva), repetir: new FormControl(repetir) },
        { validators: camposCoinciden('nueva', 'repetir') },
      );

    it('es válido si los dos campos están vacíos', () => {
      expect(grupo('', '').valid).toBe(true);
    });

    it('es válido si coinciden', () => {
      expect(grupo('secreto1', 'secreto1').valid).toBe(true);
    });

    it('marca noCoinciden si son distintos o falta uno', () => {
      expect(grupo('secreto1', 'secreto2').hasError('noCoinciden')).toBe(true);
      expect(grupo('secreto1', '').hasError('noCoinciden')).toBe(true);
      expect(grupo('', 'secreto1').hasError('noCoinciden')).toBe(true);
    });
  });
});
