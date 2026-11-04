import { AbstractControl, ValidatorFn } from '@angular/forms';

/** Email con dominio y extensión de al menos dos letras (ej: nombre@dominio.com). */
export const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Largo mínimo de contraseña que exige el backend. */
export const LARGO_MINIMO_PASSWORD = 6;

/** Como `Validators.required`, pero también rechaza un valor hecho solo de espacios. */
export const obligatorioSinEspacios: ValidatorFn = (control: AbstractControl<string>) =>
  control.value?.trim() ? null : { required: true };

/**
 * Validador de grupo para pedir un dato dos veces (por ejemplo, la contraseña nueva).
 * Si los dos campos están vacíos es válido; si no, tienen que ser iguales.
 * Devuelve `{ noCoinciden: true }` en el grupo.
 */
export function camposCoinciden(campo: string, repeticion: string): ValidatorFn {
  return (grupo: AbstractControl) => {
    const valor: unknown = grupo.get(campo)?.value;
    const repetido: unknown = grupo.get(repeticion)?.value;
    if (!valor && !repetido) {
      return null;
    }
    return valor === repetido ? null : { noCoinciden: true };
  };
}
