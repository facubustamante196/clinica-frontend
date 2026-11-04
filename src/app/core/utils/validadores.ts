import { AbstractControl, ValidatorFn } from '@angular/forms';

/** Email con dominio y extensión de al menos dos letras (ej: nombre@dominio.com). */
export const PATRON_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Largo mínimo de contraseña que exige el backend. */
export const LARGO_MINIMO_PASSWORD = 6;

/** Como `Validators.required`, pero también rechaza un valor hecho solo de espacios. */
export const obligatorioSinEspacios: ValidatorFn = (control: AbstractControl<string>) =>
  control.value?.trim() ? null : { required: true };
