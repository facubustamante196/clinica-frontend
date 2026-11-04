import { describe, expect, it } from 'vitest';

import { calcularEdad, fechaHora, horaCorta, parsearFecha } from './fechas';

describe('calcularEdad', () => {
  const hoy = new Date(2026, 10, 4); // 04/11/2026

  it('cuenta los años cumplidos', () => {
    expect(calcularEdad('1995-04-12', hoy)).toBe(31);
  });

  it('no suma el año si el cumpleaños todavía no llegó', () => {
    expect(calcularEdad('1995-11-05', hoy)).toBe(30);
  });

  it('suma el año el día del cumpleaños', () => {
    expect(calcularEdad('1995-11-04', hoy)).toBe(31);
  });

  it('devuelve 0 para un recién nacido', () => {
    expect(calcularEdad('2026-10-01', hoy)).toBe(0);
  });

  it('devuelve null si la fecha falta, es inválida o es futura', () => {
    expect(calcularEdad(null, hoy)).toBeNull();
    expect(calcularEdad('', hoy)).toBeNull();
    expect(calcularEdad('no-es-fecha', hoy)).toBeNull();
    expect(calcularEdad('2030-01-01', hoy)).toBeNull();
  });

  it('no corre un día las fechas YYYY-MM-DD por zona horaria', () => {
    expect(parsearFecha('2026-11-03')?.getDate()).toBe(3);
  });
});

describe('horas', () => {
  it('recorta HH:mm:ss a HH:mm', () => {
    expect(horaCorta('09:30:00')).toBe('09:30');
    expect(horaCorta('09:30')).toBe('09:30');
    expect(horaCorta(null)).toBe('');
  });

  it('combina fecha y hora en un Date local', () => {
    const d = fechaHora('2026-11-04', '14:30');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]).toEqual([
      2026, 10, 4, 14, 30,
    ]);
  });
});
